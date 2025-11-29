const mongoose = require("mongoose");

const CompanyEarningsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plan",
    required: true
  },

  fee_amount: {
    type: Number,
    required: true
  },

  fee_percentage: {
    type: String,   // "1%" or "flat"
    required: true
  },

  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("CompanyEarnings", CompanyEarningsSchema);
