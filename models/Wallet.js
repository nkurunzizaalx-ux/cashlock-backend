// models/Wallet.js
const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    // 🔥 The correct field (matches your MongoDB documents)
    user: { 
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Main available balance
    balance: { 
      type: Number, 
      default: 0 
    },

    // Money currently locked in plans
    total_locked: { 
      type: Number, 
      default: 0 
    },

    // Currency for all wallet operations
    currency: { 
      type: String, 
      default: "RWF" 
    },

    // For analytics: total profit earned by user
    lifetime_earnings: { 
      type: Number, 
      default: 0 
    },

    // Tracks the most recent wallet update
    last_transaction_at: { 
      type: Date, 
      default: Date.now 
    },
  },
  {
    timestamps: true, // adds createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model("Wallet", WalletSchema);
