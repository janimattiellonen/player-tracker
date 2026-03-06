import "dotenv/config";
import nodemailer from "nodemailer";

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

function getEmailConfig(): EmailConfig {
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (!user || !password) {
    console.error("Error: Missing email configuration.");
    console.error("");
    console.error("Required environment variables:");
    console.error("  SMTP_USER      - Your Gmail address");
    console.error("  SMTP_PASSWORD  - Your Gmail App Password");
    console.error("");
    console.error("Usage:");
    console.error('  SMTP_USER="your@gmail.com" SMTP_PASSWORD="your-app-password" npm run test-email');
    console.error("");
    console.error("To get an App Password:");
    console.error("  1. Enable 2-Factor Authentication on your Google account");
    console.error("  2. Go to https://myaccount.google.com/apppasswords");
    console.error("  3. Generate a new App Password for 'Mail'");
    process.exit(1);
  }

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user,
    password,
  };
}

async function sendTestEmail(): Promise<void> {
  const config = getEmailConfig();
  const recipient = process.argv[2] || config.user;

  console.log("=== Email Test ===\n");
  console.log(`SMTP Host: ${config.host}`);
  console.log(`SMTP Port: ${config.port}`);
  console.log(`From: ${config.user}`);
  console.log(`To: ${recipient}`);
  console.log("");

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  console.log("Verifying connection...");

  try {
    await transporter.verify();
    console.log("Connection verified successfully!\n");
  } catch (error) {
    console.error("Connection failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log("Sending test email...");

  try {
    const info = await transporter.sendMail({
      from: config.user,
      to: recipient,
      subject: "Player Tracker - Test Email",
      text: "This is a test email from Player Tracker.\n\nIf you received this, email notifications are working correctly!",
      html: `
        <h2>Player Tracker - Test Email</h2>
        <p>This is a test email from Player Tracker.</p>
        <p>If you received this, email notifications are working correctly!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
      `,
    });

    console.log("Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("Failed to send email:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

sendTestEmail();
