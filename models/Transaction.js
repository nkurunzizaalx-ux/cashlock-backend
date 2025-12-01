const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["deposit", "lock", "unlock", "withdraw", "topup"],
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  currency: {
    type: String,
    default: "RWF"
  },

  externalId: {
    type: String
  },

  referenceId: {
    type: String
  },

  // ⭐ FIXED: Default MUST be "PENDING" so deposit callback can update it
  momo_status: {
    type: String,
    enum: ["PENDING", "SUCCESSFUL", "FAILED"],
    default: "PENDING"
  },

  failure_reason: {
    type: String,
    default: null
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan"
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", TransactionSchema);
