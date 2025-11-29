const Plan = require("../models/Plan");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");
const CompanyWallet = require("../models/CompanyWallet");
const CompanyEarnings = require("../models/CompanyEarnings");


// ------------------------------------------------------
// HELPER: Calculate service fee
// ------------------------------------------------------
function calculateFee(amount_locked) {
  let fee = 0;
  let fee_percentage = "";

  if (amount_locked <= 100000) {
    fee = Math.round(amount_locked * 0.01); // 1%
    fee_percentage = "1%";
  } else {
    fee = 1000; // Flat fee
    fee_percentage = "flat";
  }

  return { fee, fee_percentage };
}



// ------------------------------------------------------
// PREVIEW: Check fee + wallet balance BEFORE locking
// POST /api/plans/preview
// ------------------------------------------------------
exports.previewPlan = async (req, res) => {
  try {
    const { userId, amount_locked } = req.body;

    if (!userId || !amount_locked) {
      return res.status(400).json({
        success: false,
        message: "userId and amount_locked are required",
      });
    }

    // Get user wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Fee calculation
    const { fee, fee_percentage } = calculateFee(amount_locked);
    const total_deduction = amount_locked + fee;

    return res.status(200).json({
      success: true,
      wallet_balance: wallet.balance,
      amount_locked,
      fee_amount: fee,
      fee_percentage,
      total_deduction,
      can_lock: wallet.balance >= total_deduction
    });

  } catch (error) {
    console.error("Preview Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// CREATE LOCKING PLAN (Daily | Fixed | Goal)
// POST /api/plans/create
// ------------------------------------------------------
exports.createPlan = async (req, res) => {
  try {
    const {
      userId,
      plan_type,
      plan_name,
      amount_locked,
      unlock_time,
      unlock_date,
      goal_target
    } = req.body;

    // Basic validation
    if (!userId || !plan_type || !amount_locked) {
      return res.status(400).json({
        success: false,
        message: "userId, plan_type and amount_locked are required",
      });
    }

    if (!["daily", "fixed", "goal"].includes(plan_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type",
      });
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }


    // --------------------------------------------------
    // Calculate fee and check balance
    // --------------------------------------------------
    const { fee, fee_percentage } = calculateFee(amount_locked);
    const total_deduction = amount_locked + fee;

    if (wallet.balance < total_deduction) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You need ${total_deduction} RWF total.`,
      });
    }


    // --------------------------------------------------
    // Deduct total amount (locked money + fee)
    // --------------------------------------------------
    wallet.balance -= total_deduction;
    await wallet.save();


    // --------------------------------------------------
    // Prepare base plan data
    // --------------------------------------------------
    let planData = {
      userId,
      plan_type,
      plan_name: plan_name || "",
      amount_locked,
      start_date: new Date(),
      unlock_time: unlock_time || "06:00",
      is_active: true,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    };


    // DAILY PLAN
    if (plan_type === "daily") {
      planData.daily_unlock_amount = Math.round(amount_locked / 30);
      planData.remaining_amount = amount_locked;
      planData.unlock_start_date = new Date();
      planData.excluded_dates = [];
      planData.next_unlock_at = new Date();
    }

    // FIXED PLAN
    if (plan_type === "fixed") {
      if (!unlock_date) {
        return res.status(400).json({
          success: false,
          message: "unlock_date is required for fixed plans",
        });
      }
      planData.unlock_date = unlock_date;
    }

    // GOAL PLAN
    if (plan_type === "goal") {
      if (!goal_target) {
        return res.status(400).json({
          success: false,
          message: "goal_target is required for goal plans",
        });
      }

      planData.goal_target = goal_target;
      planData.progress = amount_locked;
      planData.max_top_up_allowed = goal_target - amount_locked;
      planData.top_up_allowed = true;

      if (amount_locked >= goal_target) {
        planData.status = "completed";
        planData.is_active = false;
      }
    }


    // --------------------------------------------------
    // Save the plan
    // --------------------------------------------------
    const plan = await Plan.create(planData);


    // --------------------------------------------------
    // Log user transaction
    // --------------------------------------------------
    await Transaction.create({
      userId,
      type: "lock",
      amount: amount_locked,
      currency: "RWF",
      planId: plan._id,
    });


    // --------------------------------------------------
    // Update company wallet (fee revenue)
    // --------------------------------------------------
    let companyWallet = await CompanyWallet.findOne();
    if (!companyWallet) {
      companyWallet = await CompanyWallet.create({});
    }

    companyWallet.total_earnings += fee;
    companyWallet.total_fees_collected += fee;
    companyWallet.updated_at = new Date();
    await companyWallet.save();


    // --------------------------------------------------
    // Log fee in CompanyEarnings table
    // --------------------------------------------------
    await CompanyEarnings.create({
      userId,
      planId: plan._id,
      fee_amount: fee,
      fee_percentage,
    });


    // --------------------------------------------------
    // Success response
    // --------------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
      fee_charged: fee
    });

  } catch (error) {
    console.error("Plan Creation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// GET ALL USER PLANS
// ------------------------------------------------------
exports.getUserPlans = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const plans = await Plan.find({ userId }).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      count: plans.length,
      plans,
    });

  } catch (error) {
    console.error("Fetch Plans Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
