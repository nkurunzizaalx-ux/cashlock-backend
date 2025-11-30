const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Plan = require("../models/Plan");


// ------------------------------------------------------
// NORMALIZE PHONE FORMAT (Rwanda Standard)
// ------------------------------------------------------
function normalizePhone(phone) {
  if (!phone) return phone;

  // Remove spaces
  phone = phone.toString().replace(/\s+/g, "");

  // Convert 078xxxxxxx → 25078xxxxxxx
  if (phone.startsWith("07")) {
    return "250" + phone;
  }

  // Convert +2507xxxxxxx → 2507xxxxxxx
  if (phone.startsWith("+250")) {
    return phone.replace("+250", "250");
  }

  // Convert 2507xxxxxxx (already valid)
  if (phone.startsWith("2507")) {
    return phone;
  }

  return phone;
}



// ------------------------------------------------------
// USER REGISTRATION
// ------------------------------------------------------
exports.register = async (req, res) => {
  try {
    let { phone, full_name, pin } = req.body;

    // Normalize phone
    phone = normalizePhone(phone);

    // VALIDATION
    if (!phone || !full_name || !pin) {
      return res.status(400).json({
        success: false,
        message: "phone, full_name and pin are required",
      });
    }

    if (pin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: "PIN must be exactly 4 digits",
      });
    }

    if (!/^[0-9]+$/.test(pin)) {
      return res.status(400).json({
        success: false,
        message: "PIN must contain only numbers",
      });
    }

    // CHECK IF USER EXISTS
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      });
    }

    // HASH PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // CREATE USER
    const user = await User.create({
      phone,
      full_name,
      pin: hashedPin,
    });

    // ----------------------------------------------------------
    // FIXED: CREATE WALLET (correct field name is user: user._id)
    // ----------------------------------------------------------
    await Wallet.create({
      user: user._id,
      balance: 0,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        phone: user.phone,
        full_name: user.full_name,
        momo_verified: false,
        wallet_balance: 0,
        plans_count: 0,
      },
    });

  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// USER LOGIN
// ------------------------------------------------------
exports.login = async (req, res) => {
  try {
    let { phone, pin } = req.body;

    // Normalize phone number
    phone = normalizePhone(phone);

    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: "phone and pin are required",
      });
    }

    // FIND USER
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // CHECK PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid PIN",
      });
    }

    // GET WALLET
    const wallet = await Wallet.findOne({ user: user._id });

    // COUNT USER PLANS
    const plansCount = await Plan.countDocuments({ userId: user._id });

    // UPDATE LAST LOGIN
    user.last_login = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        phone: user.phone,
        full_name: user.full_name,
        momo_verified: user.momo_verified,
        kyc_level: user.kyc_level,
        wallet_balance: wallet ? wallet.balance : 0,
        plans_count: plansCount,
      },
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
