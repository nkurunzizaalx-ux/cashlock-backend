// routes/momoCallbackRoutes.js

const express = require("express");
const router = express.Router();

const momoCallbackController = require("../controllers/momoCallbackController");
const { handleDepositCallback } = require("../controllers/depositCallbackController");

// -----------------------------
// WITHDRAWAL CALLBACK (EXISTING)
// -----------------------------
router.post("/withdraw/callback", momoCallbackController.handleWithdrawalCallback);

// -----------------------------
// DEPOSIT CALLBACK (NEW)
// MTN will hit: /momo-callback/deposit/callback/:referenceId
// -----------------------------
router.post("/deposit/callback/:referenceId", handleDepositCallback);

module.exports = router;
