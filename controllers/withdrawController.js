// controllers/withdrawController.js

const Withdrawal = require("../models/Withdrawal");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { sendMoney } = require("../utils/mtnDisbursement");


// -------------------------------------------------------------
// INITIATE WITHDRAWAL
// -------------------------------------------------------------
exports.initiateWithdrawal = async (req, res) => {
  try {
    const { userId, amount, pin } = req.body;

    if (!userId || !amount || !pin) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // 1. Fetch user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Validate PIN
    const isValidPin = await bcrypt.compare(pin, user.pin);
    if (!isValidPin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // 3. Fetch wallet
    const wallet = await Wallet.findOne({ user: userId });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // 4. Check balance
    if (wallet.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const beforeBalance = wallet.balance;

    // 5. Deduct amount immediately
    wallet.balance -= amount;
    await wallet.save();

    // 6. Create withdrawal in DB
    const withdrawal = await Withdrawal.create({
      user: userId,
      amount,
      status: "processing",
      walletBalanceBefore: beforeBalance,
      walletBalanceAfter: wallet.balance,
    });

    // 7. Send money via MTN Disbursement API
    const momoReferenceId = await sendMoney({
      amount,
      phoneNumber: user.phone, // Must be 2507XXXXXXXX
      externalId: `withdraw-${withdrawal._id}`,
    });

    // 8. Update withdrawal with MTN reference
    withdrawal.momoReferenceId = momoReferenceId;
    await withdrawal.save();

    // 9. Create transaction log
    await Transaction.create({
      user: userId,
      type: "withdrawal_pending",
      amount,
      description: "Withdrawal request initiated",
      reference: withdrawal._id,
    });

    return res.status(200).json({
      message: "Withdrawal request submitted",
      status: "processing",
      withdrawalId: withdrawal._id,
      momoReferenceId,
    });

  } catch (err) {
    console.error("Withdraw Error:", err);

    return res.status(500).json({
      message: "Withdrawal failed",
      error: err.message,
    });
  }
};



// -------------------------------------------------------------
// GET WITHDRAWAL STATUS
// -------------------------------------------------------------
exports.getWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    return res.status(200).json(withdrawal);

  } catch (err) {
    console.error("Status Error:", err);
    return res.status(500).json({ message: "Error retrieving withdrawal status" });
  }
};
