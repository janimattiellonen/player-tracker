import "dotenv/config";
import { PlayerRepository } from "./repository.js";
import { closeDb } from "./db.js";
import { buildNotificationMessage } from "./notification-builder.js";
import { sendEmail, getEmailConfig, createMailer } from "./email-service.js";

interface NotifyResult {
  success: boolean;
  resultsFound: number;
  resultsNotified: number;
  error?: string;
}

export async function notifyNewResults(): Promise<NotifyResult> {
  const repository = new PlayerRepository();
  const emailConfig = getEmailConfig();

  try {
    // Fetch unnotified results
    const results = await repository.getUnnotifiedResults();

    if (results.length === 0) {
      console.log("No new results to notify about.");
      return {
        success: true,
        resultsFound: 0,
        resultsNotified: 0,
      };
    }

    console.log(`Found ${results.length} unnotified result(s).`);

    // Look up player names
    const pdgaNumbers = [...new Set(results.map((r) => r.pdga_number))];
    const playerNames = new Map<string, string>();
    for (const pdgaNumber of pdgaNumbers) {
      const player = await repository.getTrackedPlayer(pdgaNumber);
      if (player?.name) {
        playerNames.set(pdgaNumber, player.name);
      }
    }

    // Build notification message
    const notificationData = {
      results,
      generatedAt: new Date().toISOString(),
      playerNames,
    };
    const message = buildNotificationMessage(notificationData);

    // Send email
    console.log("Sending notification email...");
    const mailer = emailConfig.mockMode ? null : createMailer(emailConfig);
    const sendResult = await sendEmail(emailConfig, mailer, message);

    if (!sendResult.success) {
      console.error(`Failed to send email: ${sendResult.error}`);
      return {
        success: false,
        resultsFound: results.length,
        resultsNotified: 0,
        error: sendResult.error,
      };
    }

    console.log(
      sendResult.mocked
        ? "Email sent (mock mode)"
        : `Email sent successfully (ID: ${sendResult.messageId})`
    );

    // Mark results as notified
    const resultIds = results.map((r) => r.id);
    await repository.markAsNotified(resultIds);
    console.log(`Marked ${resultIds.length} result(s) as notified.`);

    return {
      success: true,
      resultsFound: results.length,
      resultsNotified: results.length,
    };
  } finally {
    await closeDb();
  }
}

async function main(): Promise<void> {
  console.log("=== Player Tracker - Notification ===\n");

  const result = await notifyNewResults();

  console.log("\n=== Summary ===");
  console.log(`Results found: ${result.resultsFound}`);
  console.log(`Results notified: ${result.resultsNotified}`);

  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
}

// Only run main() when executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error("Fatal error:", error.message);
    process.exit(1);
  });
}
