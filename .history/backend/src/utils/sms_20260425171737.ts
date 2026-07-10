import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { config } from "../config";

type SmsProvider = "msg91" | "twilio" | "custom";

interface SmsLog {
  timestamp: string;
  provider: string;
  phoneRaw: string;
  phoneFormatted: string;
  status: "attempt" | "sent" | "failed";
  request?: Record<string, string>;
  statusCode?: number;
  error?: string;
  response?: string;
}

const logs: SmsLog[] = [];
const logFilePath = path.resolve(process.cwd(), "logs", "sms.log");

const isPlaceholder = (value?: string | null) => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized.includes("your_") || normalized.includes("replace") || normalized.includes("here");
};

const recordLog = async (entry: SmsLog) => {
  logs.push(entry);
  if (logs.length > 200) logs.shift();
  console.log(`[SMS ${entry.status.toUpperCase()}] ${entry.provider} -> ${entry.phoneFormatted}`);
  if (entry.error) console.log(`  Error: ${entry.error}`);
  if (entry.response) console.log(`  Response: ${entry.response}`);
  await mkdir(path.dirname(logFilePath), { recursive: true });
  await appendFile(logFilePath, `${JSON.stringify(entry)}\n`, "utf8");
};

const normalizeIndianPhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return {
      e164: `+91${cleaned}`,
      msg91: `91${cleaned}`
    };
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const national = cleaned.slice(2);
    return {
      e164: `+91${national}`,
      msg91: cleaned
    };
  }
  throw new Error("Phone number must be in Indian format: +91XXXXXXXXXX or 10 digits.");
};

const readResponseText = async (response: Response) => {
  return response.text().catch(() => "");
};

const providerAccepted = (provider: SmsProvider, responseText: string) => {
  const normalized = responseText.trim().toLowerCase();
  if (!normalized) return false;
  if (provider === "msg91") {
    return !/(error|invalid|missing|denied|blocked|failed)/i.test(normalized);
  }
  return true;
};

const sendViaMsg91 = async (phone: string, message: string): Promise<void> => {
  const apiKey = config.sms.msg91.apiKey;
  const templateId = config.sms.msg91.templateId;
  if (isPlaceholder(apiKey)) {
    throw new Error("MSG91 API key is not configured. Set a real MSG91_API_KEY in backend/.env.");
  }
  if (isPlaceholder(templateId)) {
    throw new Error("MSG91 DLT template is not configured. Set MSG91_TEMPLATE_ID in backend/.env.");
  }

  const formattedPhone = normalizeIndianPhone(phone);
  const params = new URLSearchParams({
    authkey: apiKey!,
    mobiles: formattedPhone.msg91,
    message,
    sender: config.sms.msg91.senderId,
    route: config.sms.msg91.route,
    unicode: "0",
    DLT_TE_ID: templateId!
  });

  if (!isPlaceholder(config.sms.msg91.peId)) {
    params.set("PE_ID", config.sms.msg91.peId!);
  }

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "MSG91",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "attempt",
    request: {
      route: config.sms.msg91.route,
      senderId: config.sms.msg91.senderId,
      templateId: templateId!
    }
  });

  const response = await fetch(`https://control.msg91.com/api/sendhttp.php?${params.toString()}`, {
    method: "GET",
    signal: AbortSignal.timeout(config.sms.timeoutMs)
  });
  const responseText = await readResponseText(response);

  if (!response.ok || !providerAccepted("msg91", responseText)) {
    throw new Error(`MSG91 rejected the OTP request: ${responseText || `HTTP ${response.status}`}`);
  }

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "MSG91",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "sent",
    statusCode: response.status,
    response: responseText
  });
};

const sendViaTwilio = async (phone: string, message: string): Promise<void> => {
  const { accountSid, authToken, phoneNumber } = config.sms.twilio;
  if (isPlaceholder(accountSid) || isPlaceholder(authToken) || isPlaceholder(phoneNumber)) {
    throw new Error("Twilio fallback is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_PHONE_NUMBER.");
  }

  const formattedPhone = normalizeIndianPhone(phone);
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const body = new URLSearchParams({
    From: phoneNumber!,
    To: formattedPhone.e164,
    Body: message
  });

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "Twilio",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "attempt",
    request: {
      from: phoneNumber!,
      to: formattedPhone.e164
    }
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: body.toString(),
    signal: AbortSignal.timeout(config.sms.timeoutMs)
  });
  const responseText = await readResponseText(response);

  if (!response.ok) {
    throw new Error(`Twilio rejected the OTP request: ${responseText || `HTTP ${response.status}`}`);
  }

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "Twilio",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "sent",
    statusCode: response.status,
    response: responseText
  });
};

const sendViaCustom = async (phone: string, message: string): Promise<void> => {
  const webhookUrl = config.sms.custom.webhookUrl;
  if (isPlaceholder(webhookUrl)) {
    throw new Error("Custom SMS webhook is not configured. Set SMS_WEBHOOK_URL in backend/.env.");
  }

  const formattedPhone = normalizeIndianPhone(phone);
  const payload = {
    to: formattedPhone.e164,
    message
  };

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "CustomWebhook",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "attempt",
    request: {
      to: formattedPhone.e164
    }
  });

  const response = await fetch(webhookUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.sms.custom.apiKey ? { Authorization: `Bearer ${config.sms.custom.apiKey}` } : {})
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.sms.timeoutMs)
  });
  const responseText = await readResponseText(response);

  if (!response.ok) {
    throw new Error(`Custom SMS provider rejected the OTP request: ${responseText || `HTTP ${response.status}`}`);
  }

  await recordLog({
    timestamp: new Date().toISOString(),
    provider: "CustomWebhook",
    phoneRaw: phone,
    phoneFormatted: formattedPhone.e164,
    status: "sent",
    statusCode: response.status,
    response: responseText
  });
};

const sendWithProvider = async (provider: SmsProvider, phone: string, message: string) => {
  if (provider === "msg91") return sendViaMsg91(phone, message);
  if (provider === "twilio") return sendViaTwilio(phone, message);
  return sendViaCustom(phone, message);
};

const configuredProviders = (): SmsProvider[] => {
  const providers = [config.sms.provider, config.sms.fallbackProvider]
    .map((value) => value.trim().toLowerCase())
    .filter((value, index, array) => value.length > 0 && array.indexOf(value) === index) as SmsProvider[];

  if (providers.length === 0) {
    throw new Error("No SMS provider is configured. Set SMS_PROVIDER in backend/.env.");
  }

  return providers;
};

export const sendOtpSms = async (phone: string, message: string): Promise<void> => {
  const providerErrors: string[] = [];

  for (const provider of configuredProviders()) {
    try {
      await sendWithProvider(provider, phone, message);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown SMS error";
      providerErrors.push(`${provider}: ${errorMessage}`);
      await recordLog({
        timestamp: new Date().toISOString(),
        provider: provider.toUpperCase(),
        phoneRaw: phone,
        phoneFormatted: normalizeIndianPhone(phone).e164,
        status: "failed",
        error: errorMessage
      });
    }
  }

  throw new Error(providerErrors.join(" | "));
};

export const getSmsLogs = () => logs.slice(-100);
