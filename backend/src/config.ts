import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const isProduction = process.env.NODE_ENV === "production";
const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  "postgresql://postgres:postgres@localhost:5432/vadhiyar?schema=public";
const jwtSecret = process.env.JWT_SECRET?.trim() || "change-me";

if (!/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error("DATABASE_URL must be a PostgreSQL connection URL.");
}
if (isProduction && !process.env.DATABASE_URL?.trim()) {
  throw new Error("DATABASE_URL must be configured for the production backend.");
}
if (isProduction && (jwtSecret.length < 32 || /^(change-me|replace-with)/i.test(jwtSecret))) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters in production.");
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  databaseUrl,
  ownerEmail: (process.env.OWNER_EMAIL ?? "vadhiyaragro@gmail.com").trim().toLowerCase(),
  isProduction,
  sms: {
    provider: process.env.SMS_PROVIDER ?? "",
    fallbackProvider: process.env.SMS_FALLBACK_PROVIDER ?? "",
    timeoutMs: Number(process.env.SMS_TIMEOUT_MS ?? 5000),
    msg91: {
      apiKey: process.env.MSG91_API_KEY,
      senderId: process.env.MSG91_SENDER_ID ?? "VADHYR",
      route: process.env.MSG91_ROUTE ?? "4",
      templateId: process.env.MSG91_TEMPLATE_ID,
      peId: process.env.MSG91_PE_ID
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    custom: {
      webhookUrl: process.env.SMS_WEBHOOK_URL,
      apiKey: process.env.SMS_WEBHOOK_API_KEY
    },
    template:
      process.env.SMS_OTP_TEMPLATE ??
      "Your Vadhiyar Agrotech verification code is {{CODE}}. It expires in {{MINUTES}} minutes."
  }
};
