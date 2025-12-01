// models/Wallet.js
const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    balance: { 
      type: Number, 
      default: 0 
    },

    total_locked: { 
      type: Number, 
      default: 0 
    },

    currency: { 
      type: String, 
      default: "RWF" 
    },

    lifetime_earnings: { 
      type: Number, 
      default: 0 
    }, // future use: company revenue tracking

    last_transaction_at: { 
      type: Date, 
      default: Date.now 
    },
  },
  {
    timestamps: true, // auto adds createdAt & updatedAt
  }
);

module.exports = mongoose.model("Wallet", WalletSchema);
