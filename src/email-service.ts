import "dotenv/config";
import nodemailer from "nodemailer";
import type { NotificationMessage } from "./notification-builder.js";

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  recipient: string;
  mockMode: boolean;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  mocked: boolean;
}

function getEmailConfig(): EmailConfig {
  const mockMode = process.env.EMAIL_MOCK_MODE === "true";
  const user = process.env.SMTP_USER || "";
  const password = process.env.SMTP_PASSWORD || "";
  const recipient = process.env.EMAIL_TO || user;

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user,
    password,
    recipient,
    mockMode,
  };
}

function validateConfig(config: EmailConfig): void {
  if (config.mockMode) {
    return; // No validation needed in mock mode
  }

  if (!config.user || !config.password) {
    throw new Error(
      "Email configuration missing. Set SMTP_USER and SMTP_PASSWORD in .env, " +
        "or enable mock mode with EMAIL_MOCK_MODE=true"
    );
  }

  if (!config.recipient) {
    throw new Error("Email recipient not configured. Set EMAIL_TO in .env");
  }
}

export async function sendEmail(message: NotificationMessage): Promise<SendResult> {
  const config = getEmailConfig();

  try {
    validateConfig(config);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Configuration error",
      mocked: false,
    };
  }

  // Mock mode - just print the message
  if (config.mockMode) {
    console.log("\n" + "=".repeat(60));
    console.log("EMAIL (MOCK MODE)");
    console.log("=".repeat(60));
    console.log(`To: ${config.recipient || "(not configured)"}`);
    console.log(`From: ${config.user || "(not configured)"}`);
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

  // Real email sending
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: config.user,
      to: config.recipient,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return {
      success: true,
      messageId: info.messageId,
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

export { getEmailConfig };
