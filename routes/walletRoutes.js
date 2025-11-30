const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");

// MANUAL DEPOSIT (Admin / Testing)
router.post("/deposit", walletController.manualDeposit);

// NEW → Get full wallet info
router.get("/:userId", walletController.getWallet);

// GET WALLET BALANCE
router.get("/balance/:userId", walletController.getBalance);

// GET ALL USER TRANSACTIONS
router.get("/transactions/:userId", walletController.getTransactions);

module.exports = router;
