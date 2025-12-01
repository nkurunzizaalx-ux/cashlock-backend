// controllers/depositCallbackController.js

const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");

/**
 * MTN DEPOSIT CALLBACK HANDLER
 *
 * MTN will POST something like this:
 * {
 *   "financialTransactionId": "123456789",
 *   "externalId": "xxxx-xxxx-xxxx",
 *   "amount": "5000",
 *   "currency": "RWF",
 *   "status": "SUCCESSFUL" | "FAILED"
 * }
 *
 * MTN sends the ReferenceId inside the URL:
 * /momo-callback/deposit/callback/:referenceId
 */
exports.handleDepositCallback = async (req, res) => {
  try {
    const referenceId = req.params.referenceId;
    const payload = req.body;

    console.log("📩 Deposit callback received:", payload);

    if (!referenceId) {
      return res.status(400).json({ message: "Missing referenceId in callback URL" });
    }

    // 1️⃣ Find the deposit transaction
    const transaction = await Transaction.findOne({ referenceId });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found for callback" });
    }

    // 2️⃣ Prevent duplicate processing
    if (transaction.momo_status === "SUCCESSFUL") {
      console.log("⚠️ Deposit already processed, ignoring duplicate callback.");
      return res.status(200).json({ message: "Already processed" });
    }

    // 3️⃣ Extract MTN callback status
    const status = payload.status?.toUpperCase() || "FAILED";

    // 4️⃣ If deposit FAILED
    if (status !== "SUCCESSFUL") {
      transaction.momo_status = status;
      transaction.failure_reason = payload.reason || "Unknown MTN failure";
      await transaction.save();

      console.log("❌ Deposit failed:", transaction);

      return res.status(200).json({ message: "Deposit marked as failed" });
    }

    // 5️⃣ If deposit SUCCESSFUL → update wallet
    transaction.momo_status = "SUCCESSFUL";
    transaction.failure_reason = null;
    await transaction.save();

    // 🔥 FIXED: wallet lookup must use field "user"
    const wallet = await Wallet.findOne({ user: transaction.userId });

    if (!wallet) {
      console.error("❌ Wallet not found for user:", transaction.userId);
      return res.status(500).json({ message: "Wallet not found" });
    }

    // 6️⃣ Add deposit amount
    wallet.balance += transaction.amount;
    wallet.last_transaction_at = new Date();
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
