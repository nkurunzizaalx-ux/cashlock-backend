// ------------------------------------------------------
// TOP-UP GOAL PLAN
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

    // Fetch wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    // Check wallet balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Check top-up limits
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

    // Deduct from wallet
    wallet.balance -= amount;
    await wallet.save();

    // Update plan progress
    plan.progress += amount;
    plan.max_top_up_allowed = plan.goal_target - plan.progress;
    plan.top_up_allowed = plan.progress < plan.goal_target;
    plan.updated_at = new Date();

    // Auto-complete if goal reached
    if (plan.progress >= plan.goal_target) {
      plan.status = "completed";
      plan.is_active = false;
      plan.is_goal_met = true;
    }

    await plan.save();

    // Log transaction
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
