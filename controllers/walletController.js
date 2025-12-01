const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");


// ------------------------------------------------------
// MANUAL DEPOSIT (Admin, Testing, Development Only)
// Secured with Admin Key + Disabled in Production
// ------------------------------------------------------
exports.manualDeposit = async (req, res) => {
  try {
    // 🔐 Disable manual deposit in PRODUCTION automatically
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({
        success: false,
        message: "Manual deposit is disabled in production for security reasons.",
      });
    }

    // 🔐 Admin Key Security: requires x-admin-key header
    const adminKey = req.headers["x-admin-key"];
    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: Invalid or missing admin key.",
      });
    }

    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "userId and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    // Fetch wallet OR create it automatically if missing
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = await Wallet.create({
        userId,
        balance: 0,
        total_locked: 0,
        lifetime_earnings: 0,
      });
    }

    // Update balance
    wallet.balance += amount;
    wallet.last_transaction_at = new Date();
    await wallet.save();

    // Log transaction
    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency: "RWF",
      momo_status: "SUCCESSFUL",
      created_at: new Date()
    });

    return res.status(200).json({
      success: true,
      message: "Deposit successful (DEV MODE)",
      new_balance: wallet.balance
    });

  } catch (error) {
    console.error("Deposit Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// GET FULL WALLET OBJECT
// ------------------------------------------------------
exports.getWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      wallet,
    });

  } catch (error) {
    console.error("Get Wallet Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// GET USER WALLET BALANCE
// ------------------------------------------------------
exports.getBalance = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    return res.status(200).json({
      success: true,
      balance: wallet.balance,
    });

  } catch (error) {
    console.error("Get Balance Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// GET ALL USER TRANSACTIONS
// ------------------------------------------------------
exports.getTransactions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const transactions = await Transaction.find({ userId })
      .sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      count: transactions.length,
      transactions,
    });

  } catch (error) {
    console.error("Get Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
