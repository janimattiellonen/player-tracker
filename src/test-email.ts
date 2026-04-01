import "dotenv/config";
import { getEmailConfig, createMailer } from "./email-service.js";
import type { Mailer } from "./mailer.js";

async function sendTestEmail(): Promise<void> {
  const config = getEmailConfig();
  const recipient = process.argv[2] || config.recipient;
  const from = config.provider === "resend" ? config.resendFrom : config.user;

  console.log("=== Email Test ===\n");
  console.log(`Provider: ${config.provider}`);
  if (config.provider === "nodemailer") {
    console.log(`SMTP Host: ${config.host}`);
    console.log(`SMTP Port: ${config.port}`);
  }
  console.log(`From: ${from}`);
  console.log(`To: ${recipient}`);
  console.log("");

  let mailer: Mailer;
  try {
    mailer = createMailer(config);
  } catch (error) {
    console.error("Configuration error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }

  if (mailer.verify) {
    console.log("Verifying connection...");
    try {
      await mailer.verify();
      console.log("Connection verified successfully!\n");
    } catch (error) {
      console.error("Connection failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  if (!recipient) {
    console.error("Error: No recipient configured. Set EMAIL_TO in .env or pass as argument.");
    process.exit(1);
  }

  console.log("Sending test email...");

  try {
    const result = await mailer.sendMail({
      from,
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
    console.log(`Message ID: ${result.messageId}`);
  } catch (error) {
    console.error("Failed to send email:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

sendTestEmail();
