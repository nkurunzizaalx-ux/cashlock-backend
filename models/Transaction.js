const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["deposit", "lock", "unlock", "withdraw", "topup"], // ⭐ FIXED
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

  momo_status: {
    type: String,
    default: "SUCCESSFUL"
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
