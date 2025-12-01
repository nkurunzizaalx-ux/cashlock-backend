const Withdrawal = require("../models/Withdrawal");

exports.getWithdrawalHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    // Find all withdrawals by user
    const withdrawals = await Withdrawal.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: withdrawals.length,
      withdrawals,
    });
  } catch (error) {
    console.error("❌ Withdrawal History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error retrieving withdrawal history",
    });
  }
};
