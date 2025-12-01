// controllers/depositCallbackController.js

const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");

exports.handleDepositCallback = async (req, res) => {
  try {
    const referenceId = req.params.referenceId;
    const payload = req.body;

    console.log("📩 Deposit callback received:", payload);

    if (!referenceId) {
      return res.status(400).json({ message: "Missing referenceId in callback URL" });
    }

    // 1️⃣ Find transaction
    const transaction = await Transaction.findOne({ referenceId });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found for callback" });
    }

    // 2️⃣ Prevent double processing
    if (transaction.momo_status === "SUCCESSFUL") {
      return res.status(200).json({ message: "Already processed" });
    }

    const status = payload.status?.toUpperCase() || "FAILED";

    // 3️⃣ Handle failed payment
    if (status !== "SUCCESSFUL") {
      transaction.momo_status = status;
      transaction.failure_reason = payload.reason || "Unknown MTN failure";
      await transaction.save();

      return res.status(200).json({ message: "Deposit marked as failed" });
    }

    // 4️⃣ SUCCESSFUL — Update transaction
    transaction.momo_status = "SUCCESSFUL";
    transaction.failure_reason = null;
    await transaction.save();

    // 5️⃣ Find wallet using CORRECT field (user instead of userId)
    const wallet = await Wallet.findOne({ user: transaction.userId });

    if (!wallet) {
      console.error("❌ Wallet not found for user:", transaction.userId);
      return res.status(500).json({ message: "Wallet not found" });
    }

    // 6️⃣ Update wallet balance
    wallet.balance += transaction.amount;
    await wallet.save();

    console.log("💰 Wallet updated after deposit:", wallet.balance);

    return res.status(200).json({ message: "Deposit processed successfully" });

  } catch (error) {
    console.error("🔥 Error processing deposit callback:", error.message);

    return res.status(500).json({
      message: "Deposit callback error",
      error: error.message
    });
  }
};
