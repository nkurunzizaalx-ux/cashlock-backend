const mongoose = require("mongoose");

const CompanyWalletSchema = new mongoose.Schema({
  total_earnings: {
    type: Number,
    default: 0,   // total amount of fees collected
  },
  total_fees_collected: {
    type: Number,
    default: 0,   // same as total_earnings (for clarity)
  },
  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// There should ONLY be one document in this collection
module.exports = mongoose.model("CompanyWallet", CompanyWalletSchema);
