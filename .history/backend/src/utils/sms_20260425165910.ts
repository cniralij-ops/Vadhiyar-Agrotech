import { config } from "../config";

interface SmsLog {
  timestamp: string;
  provider: string;
  phone: string;
  message: string;
  status: "sent" | "failed";
  statusCode?: number;
  error?: string;
  response?: string;
}

const logs: SmsLog[] = [];

const log = (entry: SmsLog) => {
  logs.push(entry);
  console.log(`[SMS ${entry.status.toUpperCase()}] ${entry.provider} → ${entry.phone}`);
  console.log(`  Time: ${entry.timestamp}`);
  if (entry.error) console.log(`  Error: ${entry.error}`);
  if (entry.response) console.log(`  Response: ${entry.response}`);
};

// Validate and format Indian phone numbers
const formatIndianPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) return "91" + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return cleaned;
  if (cleaned.startsWith("+91")) return cleaned.substring(1);
  return cleaned;
};

// MSG91 Provider - Primary for India
const sendViaMsg91 = async (phone: string, message: string): Promise<void> => {
  const apiKey = config.sms.msg91.apiKey;
  if (!apiKey) {
    throw new Error("MSG91 API key not configured. Set MSG91_API_KEY in .env");
  }

  const formattedPhone = formatIndianPhone(phone);
  const url = "https://control.msg91.com/api/sendhttp.php";
  const params = new URLSearchParams({
    authkey: apiKey,
    mobiles: formattedPhone,
    message,
    sender: config.sms.msg91.senderId,
    route: config.sms.msg91.route,
    unicode: "0"
  });

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "GET",
      timeout: 10000
    });

    const text = await response.text();
    
    if (!response.ok || text.includes("error") || text.includes("invalid")) {
      throw new Error(`MSG91 failed: ${text}`);
    }

    log({
      timestamp: new Date().toISOString(),
      provider: "MSG91",
      phone: formattedPhone,
      message,
      status: "sent",
      statusCode: response.status,
      response: text
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    log({
      timestamp: new Date().toISOString(),
      provider: "MSG91",
      phone: formattedPhone,
      message,
      status: "failed",
      error: errorMsg
    });
    throw new Error(`SMS delivery failed: ${errorMsg}`);
  }
};

// Twilio Provider - Fallback/Global
const sendViaTwilio = async (phone: string, message: string): Promise<void> => {
  const { accountSid, authToken, phoneNumber } = config.sms.twilio;
  if (!accountSid || !authToken || !phoneNumber) {
    throw new Error("Twilio not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER");
  }

  const formattedPhone = "+" + formatIndianPhone(phone);
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  try {
    const params = new URLSearchParams({
      From: phoneNumber,
      To: formattedPhone,
      Body: message
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const data = await response.json() as any;

    if (!response.ok || data.error_code) {
      throw new Error(`Twilio error: ${data.error_message || data.message || "Unknown"}`);
    }

    log({
      timestamp: new Date().toISOString(),
      provider: "Twilio",
      phone: formattedPhone,
      message,
      status: "sent",
      statusCode: response.status,
      response: data.sid
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    log({
      timestamp: new Date().toISOString(),
      provider: "Twilio",
      phone: "+" + formatIndianPhone(phone),
      message,
      status: "failed",
      error: errorMsg
    });
    throw new Error(`SMS delivery failed: ${errorMsg}`);
  }
};

// Custom Webhook Provider
const sendViaCustom = async (phone: string, message: string): Promise<void> => {
  const webhookUrl = config.sms.custom.webhookUrl;
  if (!webhookUrl) {
    throw new Error("Custom webhook URL not configured. Set SMS_WEBHOOK_URL in .env");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (config.sms.custom.apiKey) {
    headers.Authorization = `Bearer ${config.sms.custom.apiKey}`;
  }

  const payload = {
    to: phone,
    message
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
      throw new Error(text || "Webhook rejected request");
    }

    log({
      timestamp: new Date().toISOString(),
      provider: "CustomWebhook",
      phone,
      message,
      status: "sent",
      statusCode: response.status,
      response: text
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    log({
      timestamp: new Date().toISOString(),
      provider: "CustomWebhook",
      phone,
      message,
      status: "failed",
      error: errorMsg
    });
    throw new Error(`SMS delivery failed: ${errorMsg}`);
  }
};

export const sendOtpSms = async (phone: string, message: string): Promise<void> => {
  const provider = config.sms.provider;

  if (provider === "msg91") {
    await sendViaMsg91(phone, message);
  } else if (provider === "twilio") {
    await sendViaTwilio(phone, message);
  } else if (provider === "custom") {
    await sendViaCustom(phone, message);
  } else {
    throw new Error(`Unknown SMS provider: ${provider}`);
  }
};

// Endpoint to view logs (for debugging)
export const getSmsLogs = () => logs.slice(-100); // Last 100 logs
