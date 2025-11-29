const express = require("express");
const router = express.Router();
const unlockController = require("../controllers/unlockController");

// ------------------------------------------------------
// RUN UNLOCK ENGINE MANUALLY (for testing)
// POST /api/unlock/run
// ------------------------------------------------------
router.post("/run", unlockController.runUnlockEngine);

module.exports = router;
