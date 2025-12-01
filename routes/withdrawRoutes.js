// routes/withdrawRoutes.js

const express = require("express");
const router = express.Router();

const {
  initiateWithdrawal,
  getWithdrawalStatus,
} = require("../controllers/withdrawController");

const {
  getWithdrawalHistory,
} = require("../controllers/withdrawalHistoryController");

// -------------------------------------------------------------
// WITHDRAWAL ROUTES
// -------------------------------------------------------------

// Initiate withdrawal (PIN + amount)
router.post("/initiate", initiateWithdrawal);

// Get status of a specific withdrawal
router.get("/status/:id", getWithdrawalStatus);

// NEW: Get withdrawal history for a user
router.get("/history/:userId", getWithdrawalHistory);

module.exports = router;
