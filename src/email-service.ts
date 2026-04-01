import "dotenv/config";
import type { NotificationMessage } from "./notification-builder.js";
import type { Mailer } from "./mailer.js";
import { NodemailerMailer } from "./nodemailer-mailer.js";
import { ResendMailer } from "./resend-mailer.js";

export interface EmailConfig {
  provider: "nodemailer" | "resend";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  resendApiKey: string;
  resendFrom: string;
  recipient: string;
  mockMode: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mocked: boolean;
}

export function getEmailConfig(): EmailConfig {
  const mockMode = process.env.EMAIL_MOCK_MODE === "true";
  const user = process.env.SMTP_USER || "";
  const password = process.env.SMTP_PASSWORD || "";
  const recipient = process.env.EMAIL_TO || user;

  return {
    provider: (process.env.EMAIL_PROVIDER as EmailConfig["provider"]) || "nodemailer",
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user,
    password,
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendFrom: process.env.RESEND_FROM || "onboarding@resend.dev",
    recipient,
    mockMode,
  };
}

export function createMailer(config: EmailConfig): Mailer {
  if (config.provider === "resend") {
    if (!config.resendApiKey) {
      throw new Error("RESEND_API_KEY is required when EMAIL_PROVIDER=resend");
    }
    return new ResendMailer(config.resendApiKey);
  }

  if (!config.user || !config.password) {
    throw new Error(
      "Email configuration missing. Set SMTP_USER and SMTP_PASSWORD in .env, " +
        "or enable mock mode with EMAIL_MOCK_MODE=true"
    );
  }

  return new NodemailerMailer({
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    password: config.password,
  });
}

export async function sendEmail(mailer: Mailer, message: NotificationMessage): Promise<SendResult> {
  const config = getEmailConfig();

  // Mock mode - just print the message
  if (config.mockMode) {
    console.log("\n" + "=".repeat(60));
    console.log("EMAIL (MOCK MODE)");
    console.log("=".repeat(60));
    console.log(`To: ${config.recipient || "(not configured)"}`);
    console.log(`From: ${config.provider === "resend" ? config.resendFrom : config.user}`);
    console.log(`Subject: ${message.subject}`);
    console.log("-".repeat(60));
    console.log(message.text);
    console.log("=".repeat(60) + "\n");

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mocked: true,
    };
  }

  const from = config.provider === "resend" ? config.resendFrom : config.user;

  try {
    const result = await mailer.sendMail({
      from,
      to: config.recipient,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return {
      success: true,
      messageId: result.messageId,
      mocked: false,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      mocked: false,
    };
  }
}
