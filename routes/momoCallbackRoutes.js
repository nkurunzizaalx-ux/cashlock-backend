// routes/momoCallbackRoutes.js

const express = require("express");
const router = express.Router();
const momoCallbackController = require("../controllers/momoCallbackController");

// MTN Callback for Withdrawal
router.post("/withdraw/callback", momoCallbackController.handleWithdrawalCallback);

module.exports = router;
