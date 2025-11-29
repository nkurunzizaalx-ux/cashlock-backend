const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

// ------------------------------------------------------
// USER REGISTRATION
// ------------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { phone, full_name, pin } = req.body;

    // 1) BASIC VALIDATION
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

    // 2) CHECK IF USER EXISTS
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this phone number",
      });
    }

    // 3) HASH THE PIN
    const hashedPin = await bcrypt.hash(pin, 10);

    // 4) CREATE USER
    const user = await User.create({
      phone,
      full_name,
      pin: hashedPin,
    });

    // 5) CREATE WALLET FOR USER
    const wallet = await Wallet.create({
      userId: user._id,
      balance: 0,
    });

    // 6) RETURN RESPONSE
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        phone: user.phone,
        full_name: user.full_name,
        wallet_balance: wallet.balance,
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
    const { phone, pin } = req.body;

    // 1) BASIC VALIDATION
    if (!phone || !pin) {
      return res.status(400).json({
        success: false,
        message: "phone and pin are required",
      });
    }

    // 2) FIND USER
    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3) COMPARE PIN WITH HASHED PIN
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid PIN",
      });
    }

    // 4) GET USER WALLET
    const wallet = await Wallet.findOne({ userId: user._id });

    // 5) UPDATE LAST LOGIN
    user.last_login = new Date();
    await user.save();

    // 6) RETURN RESPONSE
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
