import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  isProduction: process.env.NODE_ENV === "production",
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
