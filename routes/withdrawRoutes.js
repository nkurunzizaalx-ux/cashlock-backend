// routes/withdrawRoutes.js

const express = require("express");
const router = express.Router();

const {
  initiateWithdrawal,
  getWithdrawalStatus,
} = require("../controllers/withdrawController");


// -------------------------------------------------------------
// WITHDRAWAL ROUTES
// -------------------------------------------------------------

// Initiate withdrawal (PIN + amount)
router.post("/initiate", initiateWithdrawal);

// Get status of a specific withdrawal
router.get("/status/:id", getWithdrawalStatus);


module.exports = router;
