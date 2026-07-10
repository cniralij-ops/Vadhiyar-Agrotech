import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  databaseUrl: process.env.DATABASE_URL ?? "file:./dev.db",
  sms: {
    provider: process.env.SMS_PROVIDER ?? "msg91", // "msg91" | "twilio" | "custom"
    // MSG91 Configuration (recommended for India)
    msg91: {
      apiKey: process.env.MSG91_API_KEY,
      senderId: process.env.MSG91_SENDER_ID ?? "VADHYR",
      route: process.env.MSG91_ROUTE ?? "4" // 1: Promotional, 4: Transactional
    },
    // Twilio Configuration (for global/test)
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER
    },
    // Custom Webhook Configuration
    custom: {
      webhookUrl: process.env.SMS_WEBHOOK_URL,
      apiKey: process.env.SMS_WEBHOOK_API_KEY
    },
    template:
      process.env.SMS_OTP_TEMPLATE ??
      "Your Vadhiyar Agrotech verification code is {{CODE}}. It expires in {{MINUTES}} minutes."
  }
};
