const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  full_name: { type: String, required: true },

  pin: { type: String, required: true },  // hashed PIN

  gender: { type: String },
  birth_year: { type: Number },

  id_type: { type: String },
  momo_verified: { type: Boolean, default: false },

  kyc_level: { type: Number, default: 1 },

  wallet_balance: { type: Number, default: 0 },
  total_locked: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  last_login: { type: Date }
});

module.exports = mongoose.model("User", UserSchema);
