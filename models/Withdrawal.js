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

    // MTN MoMo reference ID (UUID)
    momoReferenceId: {
      type: String,
    },

    // Reason for failure (if any)
    failureReason: {
      type: String,
    },

    // Snapshot of wallet at withdrawal time
    walletBalanceBefore: {
      type: Number,
    },
    walletBalanceAfter: {
      type: Number,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model("Withdrawal", WithdrawalSchema);
