import { config } from "../config";

export const sendOtpSms = async (phone: string, message: string) => {
  // Dev mode: log to console if no SMS provider configured
  if (!config.sms.webhookUrl) {
    console.log("📱 [OTP SMS - DEV MODE]");
    console.log(`   Phone: ${phone}`);
    console.log(`   Message: ${message}`);
    console.log("   (No SMS_WEBHOOK_URL configured - OTP codes will log to console)");
    return;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };

  if (config.sms.apiKey) {
    headers.Authorization = `Bearer ${config.sms.apiKey}`;
  }

  const payload: Record<string, string> = {
    to: phone,
    message
  };

  if (config.sms.senderId) {
    payload.senderId = config.sms.senderId;
  }

  const fetchFn = globalThis.fetch;
  if (typeof fetchFn !== "function") {
    throw new Error("Fetch API is not available in this runtime");
  }

  const response = await fetchFn(config.sms.webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "SMS provider rejected the request");
  }
};
