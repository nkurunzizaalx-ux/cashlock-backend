const Plan = require("../models/Plan");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// ------------------------------------------------------
// CREATE LOCKING PLAN (Daily | Fixed | Goal)
// ------------------------------------------------------
exports.createPlan = async (req, res) => {
  try {
    const {
      userId,
      plan_type,
      plan_name,
      amount_locked,
      unlock_time,       // optional (default 06:00)
      unlock_date,       // fixed only
      goal_target        // goal only
    } = req.body;

    // -------------------------------
    // 1) Basic validation
    // -------------------------------
    if (!userId || !plan_type || !amount_locked) {
      return res.status(400).json({
        success: false,
        message: "userId, plan_type and amount_locked are required"
      });
    }

    if (!["daily", "fixed", "goal"].includes(plan_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan type"
      });
    }

    // -------------------------------
    // 2) Validate wallet balance
    // -------------------------------
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < amount_locked) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance"
      });
    }

    // Deduct money from wallet
    wallet.balance -= amount_locked;
    await wallet.save();

    // -------------------------------
    // 3) Base Plan Data
    // -------------------------------
    let planData = {
      userId,
      plan_type,
      plan_name: plan_name || "",
      amount_locked,
      start_date: new Date(),
      unlock_time: unlock_time || "06:00", // default
      is_active: true,
      status: "active",
      created_at: new Date(),
      updated_at: new Date(),
    };

    // -------------------------------
    // DAILY PLAN LOGIC
    // -------------------------------
    if (plan_type === "daily") {
      planData.daily_unlock_amount = Math.round(amount_locked / 30);
      planData.remaining_amount = amount_locked;
      planData.unlock_start_date = new Date();
      planData.unlock_end_date = null;  // will be filled when completed
      planData.excluded_dates = [];
      planData.next_unlock_at = new Date(); // next daily unlock
    }

    // -------------------------------
    // FIXED PLAN LOGIC
    // -------------------------------
    if (plan_type === "fixed") {
      if (!unlock_date) {
        return res.status(400).json({
          success: false,
          message: "unlock_date is required for fixed plans"
        });
      }
      planData.unlock_date = unlock_date;
    }

    // -------------------------------
    // GOAL PLAN LOGIC
    // -------------------------------
    if (plan_type === "goal") {
      if (!goal_target) {
        return res.status(400).json({
          success: false,
          message: "goal_target is required for goal plans"
        });
      }

      planData.goal_target = goal_target;
      planData.progress = amount_locked;
      planData.max_top_up_allowed = goal_target - amount_locked;
      planData.top_up_allowed = true;
      planData.completion_time = null;

      // If goal already met at creation
      if (amount_locked >= goal_target) {
        planData.status = "completed";
        planData.is_active = false;
        planData.completion_time = new Date();
      }
    }

    // -------------------------------
    // 4) Save plan
    // -------------------------------
    const plan = await Plan.create(planData);

    // -------------------------------
    // 5) Create transaction
    // -------------------------------
    await Transaction.create({
      userId,
      type: "lock",
      amount: amount_locked,
      currency: "RWF",
      planId: plan._id,
    });

    // -------------------------------
    // 6) Response
    // -------------------------------
    return res.status(201).json({
      success: true,
      message: "Plan created successfully",
      plan,
    });

  } catch (error) {
    console.error("Plan Creation Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
