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
// PREVIEW PLAN
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

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

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
// CREATE PLAN
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

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const { fee, fee_percentage } = calculateFee(amount_locked);
    const total_deduction = amount_locked + fee;

    if (wallet.balance < total_deduction) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. You need ${total_deduction} RWF total.`,
      });
    }

    wallet.balance -= total_deduction;
    await wallet.save();

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
        planData.is_goal_met = true;
      }
    }

    const plan = await Plan.create(planData);

    await Transaction.create({
      userId,
      type: "lock",
      amount: amount_locked,
      currency: "RWF",
      planId: plan._id,
    });

    let companyWallet = await CompanyWallet.findOne();
    if (!companyWallet) {
      companyWallet = await CompanyWallet.create({});
    }

    companyWallet.total_earnings += fee;
    companyWallet.total_fees_collected += fee;
    companyWallet.updated_at = new Date();
    await companyWallet.save();

    await CompanyEarnings.create({
      userId,
      planId: plan._id,
      fee_amount: fee,
      fee_percentage,
    });

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
// GET USER PLANS
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



// ------------------------------------------------------
// UPDATE PLAN
// ------------------------------------------------------
exports.updatePlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const updates = req.body;

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "planId is required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (updates.progress !== undefined && plan.plan_type === "goal") {
      if (updates.progress > plan.goal_target) {
        return res.status(400).json({
          success: false,
          message: "Progress cannot exceed goal target",
        });
      }

      updates.max_top_up_allowed = plan.goal_target - updates.progress;
      updates.top_up_allowed = updates.progress < plan.goal_target;

      if (updates.progress >= plan.goal_target) {
        updates.is_goal_met = true;
      }
    }

    updates.updated_at = new Date();

    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      updates,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      plan: updatedPlan,
    });

  } catch (error) {
    console.error("Update Plan Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



// ------------------------------------------------------
// TOP-UP GOAL PLAN  ⭐ ADDED BELOW
// ------------------------------------------------------
exports.topUpGoalPlan = async (req, res) => {
  try {
    const { userId, planId, amount } = req.body;

    if (!userId || !planId || !amount) {
      return res.status(400).json({
        success: false,
        message: "userId, planId and amount are required",
      });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    if (plan.plan_type !== "goal") {
      return res.status(400).json({
        success: false,
        message: "Top-up only allowed for goal plans",
      });
    }

    if (!plan.is_active || plan.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This goal plan is already completed or inactive",
      });
    }

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    if (!plan.top_up_allowed) {
      return res.status(400).json({
        success: false,
        message: "Goal already reached. Top-up not allowed.",
      });
    }

    if (amount > plan.max_top_up_allowed) {
      return res.status(400).json({
        success: false,
        message: `You can only top-up up to ${plan.max_top_up_allowed} RWF`,
      });
    }

    wallet.balance -= amount;
    await wallet.save();

    plan.progress += amount;
    plan.max_top_up_allowed = plan.goal_target - plan.progress;
    plan.top_up_allowed = plan.progress < plan.goal_target;
    plan.updated_at = new Date();

    if (plan.progress >= plan.goal_target) {
      plan.status = "completed";
      plan.is_active = false;
      plan.is_goal_met = true;
    }

    await plan.save();

    await Transaction.create({
      userId,
      planId,
      type: "topup",
      amount,
      currency: "RWF",
    });

    return res.status(200).json({
      success: true,
      message: "Top-up successful",
      plan,
      wallet_balance: wallet.balance,
    });

  } catch (error) {
    console.error("Top-up Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
