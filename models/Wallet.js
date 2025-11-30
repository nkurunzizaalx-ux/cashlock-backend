const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },   // FIXED
  balance: { type: Number, default: 0 },
  currency: { type: String, default: "RWF" },

  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Wallet", WalletSchema);
