// controllers/momoCallbackController.js

const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

exports.handleWithdrawalCallback = async (req, res) => {
  try {
    console.log("🔥 CALLBACK RECEIVED FROM MTN:", req.body);

    const {
      externalId,
      status,
      financialTransactionId
    } = req.body;

    // externalId for us looks like: "withdraw-<withdrawalId>"
    if (!externalId || !status) {
      return res.status(400).json({ message: "Missing callback data" });
    }

    const withdrawalId = externalId.replace("withdraw-", "");

    // 1. Find withdrawal record
    const withdrawal = await Withdrawal.findById(withdrawalId);
    if (!withdrawal) {
      console.error("❌ Withdrawal not found:", withdrawalId);
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    // Prevent double handling
    if (withdrawal.status === "completed" || withdrawal.status === "failed") {
      return res.status(200).json({ message: "Already processed" });
    }

    // 2. SUCCESSFUL
    if (status.toUpperCase() === "SUCCESSFUL") {
      withdrawal.status = "completed";
      withdrawal.mtnTransactionId = financialTransactionId || null;
      await withdrawal.save();

      // Create transaction entry
      await Transaction.create({
        userId: withdrawal.user,
        type: "withdraw",
        amount: withdrawal.amount,
        referenceId: withdrawalId,
        externalId: financialTransactionId
      });

      return res.status(200).json({
        message: "Withdrawal marked as SUCCESSFUL"
      });
    }

    // 3. FAILED → Refund
    if (status.toUpperCase() === "FAILED") {
      withdrawal.status = "failed";
      withdrawal.failureReason = "MoMo reported failure";
      await withdrawal.save();

      // Refund wallet
      const wallet = await Wallet.findOne({ user: withdrawal.user });
      if (wallet) {
        wallet.balance += withdrawal.amount;
        await wallet.save();
      }

      await Transaction.create({
        userId: withdrawal.user,
        type: "withdraw",
        amount: withdrawal.amount,
        referenceId: withdrawalId,
        externalId: financialTransactionId
      });

      return res.status(200).json({
        message: "Withdrawal FAILED and refunded"
      });
    }

    // 4. Pending or other statuses
    withdrawal.status = "processing";
    await withdrawal.save();

    return res.status(200).json({ message: "Callback processed (PENDING)" });

  } catch (err) {
    console.error("❌ Callback Error:", err);
    return res.status(500).json({ message: "Callback processing error" });
  }
};
