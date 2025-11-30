// models/Withdrawal.js
const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      default: "RWF",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },

    // MTN MoMo reference ID (UUID) for this withdrawal
    momoReferenceId: {
      type: String,
    },

    // Short explanation if it fails (insufficient funds, MoMo error, etc.)
    failureReason: {
      type: String,
    },

    // Snapshot of wallet before/after (optional but useful for audit)
    walletBalanceBefore: {
      type: Number,
    },
    walletBalanceAfter: {
      type: Number,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt
  }
);

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
