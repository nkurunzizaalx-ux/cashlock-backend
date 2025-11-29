// cron/unlockScheduler.js
const cron = require("node-cron");
const unlockController = require("../controllers/unlockController");

// ------------------------------------------------------
// AUTO UNLOCK ENGINE (Runs every 1 minute)
// ------------------------------------------------------
// Runs at: every minute (*/1 * * * *)
// ------------------------------------------------------

cron.schedule("*/1 * * * *", async () => {
  try {
    console.log("⏳ CRON: Checking for plans to unlock...");
    await unlockController.runUnlockEngine();
    console.log("✅ CRON: Unlock engine finished.");
  } catch (error) {
    console.error("❌ CRON ERROR:", error);
  }
});
