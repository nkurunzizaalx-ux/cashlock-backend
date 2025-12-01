const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");

// MANUAL DEPOSIT (Admin / Testing) – secured with Admin Key
router.post(
  "/deposit",
  (req, res, next) => {
    const adminKey = req.headers["x-admin-key"];

    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Invalid or missing admin key.",
      });
    }

    next(); // Admin key is valid → continue to controller
  },
  walletController.manualDeposit
);

// NEW → Get full wallet info
router.get("/:userId", walletController.getWallet);

// GET WALLET BALANCE
router.get("/balance/:userId", walletController.getBalance);

// GET ALL USER TRANSACTIONS
router.get("/transactions/:userId", walletController.getTransactions);

module.exports = router;
