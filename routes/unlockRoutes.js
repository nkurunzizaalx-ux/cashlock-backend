// -------------------------------
// Unlock Routes (Manual Trigger for Testing)
// -------------------------------

const express = require("express");
const router = express.Router();

let unlockController = null;

// Safe import so server doesn't crash if controller is missing
try {
  unlockController = require("../controllers/unlockController");
} catch (err) {
  console.warn("⚠ unlockController.js not found. Using fallback route.");
}

// ------------------------------------------------------
// RUN UNLOCK ENGINE MANUALLY (TESTING)
// POST /api/unlock/run
// ------------------------------------------------------
if (unlockController && unlockController.runUnlockEngine) {
  router.post("/run", unlockController.runUnlockEngine);
} else {
  // Fallback route so Express does not crash
  router.post("/run", (req, res) => {
    res.json({
      success: true,
      message: "Unlock engine route is working, controller not implemented.",
    });
  });
}

module.exports = router;
