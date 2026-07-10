import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../utils/prisma";
import { config } from "../config";
import { registerSchema, loginSchema, otpSendSchema, otpVerifySchema, otpCompleteSchema } from "../utils/validators";
import { authenticate, AuthRequest, isValidRole } from "../middleware/auth";
import { sendOtpSms, getSmsLogs } from "../utils/sms";

const router = express.Router();

const createToken = (params: { id: number; role: "ADMIN" | "CUSTOMER"; email: string; name: string }) =>
  jwt.sign({ sub: String(params.id), role: params.role, email: params.email, name: params.name }, config.jwtSecret, {
    expiresIn: "7d"
  });

const OTP_EXPIRY_MS = 2 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 30 * 1000;
const OTP_SMS_TEMPLATE =
  config.sms.template || "Your Vadhiyar Agrotech verification code is {{CODE}}. It expires in {{MINUTES}} minutes.";

const formatOtpMessage = (code: string) => {
  const minutes = Math.round(OTP_EXPIRY_MS / 60000);
  return OTP_SMS_TEMPLATE.replace(/{{CODE}}/g, code).replace(/{{MINUTES}}/g, String(minutes));
};

const createOtpCode = () => Math.floor(100000 + Math.random() * 900000).toString();

router.post("/otp/send", async (req, res) => {
  const parse = otpSendSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  const phone = parse.data.phone.trim();
  const existingUser = await prisma.user.findFirst({ where: { phone } });
  const isExistingUser = Boolean(existingUser);

  const now = new Date();
  const recentRequest = await prisma.otpRequest.findFirst({
    where: { phone, purpose: "AUTH", consumed: false },
    orderBy: { createdAt: "desc" }
  });

  if (recentRequest && now.getTime() - recentRequest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((OTP_RESEND_COOLDOWN_MS - (now.getTime() - recentRequest.createdAt.getTime())) / 1000);
    return res.status(429).json({ message: `Please wait ${waitSeconds}s before requesting a new OTP.` });
  }

  const code = createOtpCode();
  const hashedCode = await bcrypt.hash(code, 10);
  const token = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
  const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

  const [, newOtpRequest] = await prisma.$transaction([
    prisma.otpRequest.updateMany({
      where: { phone, purpose: "AUTH", consumed: false },
      data: { consumed: true }
    }),
    prisma.otpRequest.create({
      data: {
        phone,
        codeHash: hashedCode,
        token,
        purpose: "AUTH",
        expiresAt
      }
    })
  ]);

  try {
    await sendOtpSms(phone, formatOtpMessage(code));
  } catch {
    await prisma.otpRequest.delete({ where: { id: newOtpRequest.id } }).catch(() => undefined);
    return res.status(502).json({ message: "Unable to send OTP at the moment. Please try again." });
  }

  res.status(200).json({
    token,
    isExistingUser,
    expiresAt: expiresAt.toISOString(),
    resendAvailableAt: resendAvailableAt.toISOString(),
    serverTime: now.toISOString()
  });
});

router.post("/otp/complete", async (req, res) => {
  const parse = otpCompleteSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  const { token, phone, code, name } = parse.data;
  const normalizedPhone = phone.trim();

  const record = await prisma.otpRequest.findUnique({ where: { token } });
  if (!record || record.phone !== normalizedPhone) {
    return res.status(400).json({ message: "Invalid OTP request" });
  }
  if (record.consumed) {
    return res.status(400).json({ message: "OTP already used" });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const isMatch = await bcrypt.compare(code, record.codeHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  await prisma.otpRequest.update({ where: { id: record.id }, data: { consumed: true, verified: true } });

  const existingUser = await prisma.user.findFirst({ where: { phone: normalizedPhone } });

  if (existingUser) {
    if (!isValidRole(existingUser.role)) {
      return res.status(500).json({ message: "Invalid user role" });
    }
    const jwtToken = createToken({ id: existingUser.id, role: existingUser.role, email: existingUser.email, name: existingUser.name });
    await prisma.loginHistory.create({ data: { userId: existingUser.id, action: "LOGIN", ip: req.ip } });
    return res.status(200).json({
      token: jwtToken,
      user: { id: existingUser.id, name: existingUser.name, email: existingUser.email, role: existingUser.role, phone: existingUser.phone }
    });
  }

  // New user — name required
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Please enter your name to complete registration." });
  }
  const normalizedName = name.trim();
  const generatedSecret = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(generatedSecret, 12);
  const newUser = await prisma.user.create({
    data: {
      name: normalizedName,
      email: `${normalizedPhone}@noemail.local`,
      phone: normalizedPhone,
      hashedPassword,
      role: "CUSTOMER"
    }
  });
  const jwtToken = createToken({ id: newUser.id, role: "CUSTOMER", email: newUser.email, name: newUser.name });
  await prisma.loginHistory.create({ data: { userId: newUser.id, action: "REGISTER", ip: req.ip } });
  return res.status(201).json({
    token: jwtToken,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role as "CUSTOMER" | "ADMIN", phone: newUser.phone }
  });
});

router.post("/otp/verify", async (req, res) => {
  const parse = otpVerifySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  const { token, code, phone } = parse.data;
  const record = await prisma.otpRequest.findUnique({ where: { token } });
  if (!record || record.phone !== phone.trim()) {
    return res.status(400).json({ message: "Invalid OTP request" });
  }
  if (record.consumed) {
    return res.status(400).json({ message: "OTP already used" });
  }
  if (record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  const isMatch = await bcrypt.compare(code, record.codeHash);
  if (!isMatch) {
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  if (!record.verified) {
    await prisma.otpRequest.update({ where: { id: record.id }, data: { verified: true } });
  }

  res.status(200).json({ success: true });
});

router.post("/register", async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  const { name, email, phone, addressLine, city, state, otpToken } = parse.data;
  const normalizedName = name.trim();
  const normalizedPhone = phone.trim();
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedAddress = addressLine.trim();
  const normalizedCity = city.trim();
  const normalizedState = state.trim();
  if (normalizedEmail) {
    const existingByEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingByEmail) {
      return res.status(409).json({ message: "Email already in use" });
    }
  }

  const existingByPhone = await prisma.user.findUnique({ where: { phone: normalizedPhone } });
  if (existingByPhone) {
    return res.status(409).json({ message: "Mobile number already registered" });
  }

  const otpRecord = await prisma.otpRequest.findUnique({ where: { token: otpToken } });
  if (!otpRecord || otpRecord.phone !== normalizedPhone) {
    return res.status(400).json({ message: "OTP validation failed" });
  }
  if (otpRecord.consumed) {
    return res.status(400).json({ message: "OTP already used" });
  }
  if (!otpRecord.verified || otpRecord.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: "OTP expired or unverified" });
  }

  const generatedSecret = crypto.randomBytes(32).toString("hex");
  const hashedPassword = await bcrypt.hash(generatedSecret, 12);
  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail ?? `${normalizedPhone}@noemail.local`,
      phone: normalizedPhone,
      hashedPassword,
      role: "CUSTOMER",
      profile: {
        create: {
          addressLine: normalizedAddress,
          city: normalizedCity,
          state: normalizedState
        }
      }
    }
  });

  await prisma.otpRequest.update({ where: { id: otpRecord.id }, data: { consumed: true } });

  const token = createToken({ id: user.id, role: "CUSTOMER", email: user.email, name: user.name });
  await prisma.loginHistory.create({
    data: { userId: user.id, action: "REGISTER", ip: req.ip }
  });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
});

router.post("/login", async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: parse.error.flatten().fieldErrors });
  }

  const { email, phone, password, name } = parse.data;
  const identifier = email ? { email } : { phone: phone! };
  const user = await prisma.user.findFirst({ where: identifier });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!isValidRole(user.role)) {
    return res.status(500).json({ message: "Invalid user role" });
  }

  if (user.role === "ADMIN") {
    if (!password) {
      return res.status(400).json({ message: "Password required for admin login" });
    }
    const isMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } else {
    if (!name) {
      return res.status(400).json({ message: "Name required for customer login" });
    }
    const normalizedInputName = name.trim().toLowerCase();
    const normalizedStoredName = user.name.trim().toLowerCase();
    if (normalizedInputName !== normalizedStoredName) {
      await prisma.user.update({ where: { id: user.id }, data: { name: name.trim() } });
      user.name = name.trim();
    }
  }

  const token = createToken({ id: user.id, role: user.role, email: user.email, name: user.name });
  await prisma.loginHistory.create({
    data: { userId: user.id, action: "LOGIN", ip: req.ip }
  });

  res.status(200).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
});

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  if (!req.user) return res.status(401).end();
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true }
  });
  res.status(200).json(user);
});

// Debug endpoint: View SMS delivery logs (remove in production)
router.get("/debug/sms-logs", (req, res) => {
  const logs = getSmsLogs();
  res.status(200).json({
    totalLogs: logs.length,
    recentLogs: logs,
    smsConfig: {
      provider: config.sms.provider,
      msg91ApiKeySet: !!config.sms.msg91.apiKey,
      twilioConfigured: !!(config.sms.twilio.accountSid && config.sms.twilio.authToken),
      customWebhookSet: !!config.sms.custom.webhookUrl
    }
  });
});

export default router;
