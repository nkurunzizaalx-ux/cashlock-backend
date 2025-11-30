// controllers/momoCallbackController.js

const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.handleWithdrawalCallback = async (req, res) => {
  try {
    const { referenceId, status, reason } = req.body;

    console.log("🔥 MoMo CALLBACK RECEIVED:", req.body);

    if (!referenceId || !status) {
      return res.status(400).json({ message: "Missing callback data" });
    }

    // 1. Find the withdrawal by MTN reference ID
    const withdrawal = await Withdrawal.findOne({ momoReferenceId: referenceId });

    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Already processed? Prevent double processing
    if (withdrawal.status === "completed" || withdrawal.status === "failed") {
      return res.status(200).json({ message: "Already processed" });
    }

    // 2. SUCCESSFUL WITHDRAWAL
    if (status.toLowerCase() === "successful") {
      withdrawal.status = "completed";
      await withdrawal.save();

      // Create transaction entry
      await Transaction.create({
        user: withdrawal.user,
        type: "withdrawal_completed",
        amount: withdrawal.amount,
        description: "Withdrawal completed successfully",
        reference: withdrawal._id,
      });

      return res.status(200).json({ message: "Withdrawal updated as completed" });
    }

    // 3. FAILED WITHDRAWAL → refund the user
    if (status.toLowerCase() === "failed") {
      withdrawal.status = "failed";
      withdrawal.failureReason = reason || "MoMo failed";
      await withdrawal.save();

      // Refund user wallet
      const wallet = await Wallet.findOne({ user: withdrawal.user });
      wallet.balance += withdrawal.amount;
      await wallet.save();

      // Log failed transaction
      await Transaction.create({
        user: withdrawal.user,
        type: "withdrawal_failed",
        amount: withdrawal.amount,
        description: "Withdrawal failed and amount refunded",
        reference: withdrawal._id,
      });

      return res.status(200).json({ message: "Withdrawal failed -> refunded" });
    }

    return res.status(200).json({ message: "Callback processed" });

  } catch (err) {
    console.error("❌ Callback Error:", err);
    return res.status(500).json({ message: "Callback processing error" });
  }
};
