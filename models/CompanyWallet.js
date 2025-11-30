const mongoose = require("mongoose");

const CompanyWalletSchema = new mongoose.Schema({
  total_earnings: {
    type: Number,
    default: 0,   // total amount earned by the company (fees)
  },

  total_fees_collected: {
    type: Number,
    default: 0,   // same value, kept for clear reporting
  },

  updated_at: {
    type: Date,
    default: Date.now,
  }
});

// Ensure only ONE document exists
CompanyWalletSchema.statics.getWallet = async function () {
  let wallet = await this.findOne();
  if (!wallet) {
    wallet = await this.create({});
  }
  return wallet;
};

module.exports = mongoose.model("CompanyWallet", CompanyWalletSchema);
