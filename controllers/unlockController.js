// controllers/unlockController.js

const Plan = require("../models/Plan");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

// ───────────────────────────────
// SMALL HELPERS
// ───────────────────────────────

// Format Date -> "YYYY-MM-DD"
function formatYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Build a Date object for TODAY at given "HH:MM"
function buildTodayAtTime(timeStr) {
  const now = new Date();
  const [hh, mm] = (timeStr || "06:00").split(":");
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    parseInt(hh, 10),
    parseInt(mm, 10),
    0,
    0
  );
  return d;
}

// Check if a date is within [start, end] (end can be null)
function isWithinRange(today, startDate, endDate) {
  const t = new Date(formatYMD(today));
  const s = new Date(formatYMD(startDate));

  if (t < s) return false;

  if (endDate) {
    const e = new Date(formatYMD(endDate));
    if (t > e) return false;
  }

  return true;
}

// Get next valid daily unlock date after currentDate
function getNextValidDailyDate(plan, currentDate) {
  const maxDaysAhead = 365; // safety

  for (let i = 1; i <= maxDaysAhead; i++) {
    const candidate = new Date(currentDate);
    candidate.setDate(candidate.getDate() + i);

    const candidateStr = formatYMD(candidate);
    const excluded = plan.excluded_dates || [];
    const inRange = isWithinRange(
      candidate,
      plan.unlock_start_date || plan.start_date,
      plan.unlock_end_date || null
    );

    if (!inRange) return null; // no more valid days

    if (!excluded.includes(candidateStr)) {
      return candidate;
    }
  }

  return null;
}

// ───────────────────────────────
// DAILY PLAN UNLOCK
// ───────────────────────────────
async function processDailyPlan(plan) {
  try {
    if (!plan.is_active || plan.status !== "active") return;
    if (!plan.remaining_amount || plan.remaining_amount <= 0) {
      // Mark completed if nothing left
      plan.is_active = false;
      plan.status = "completed";
      await plan.save();
      return;
    }

    const now = new Date();
    const todayStr = formatYMD(now);

    const startDate = plan.unlock_start_date || plan.start_date;
    const endDate = plan.unlock_end_date || null;
    const excluded = plan.excluded_dates || [];

    // 1) Check date range
    const inRange = isWithinRange(now, startDate, endDate);
    if (!inRange) {
      // If today is beyond end date, close the plan
      if (endDate && new Date(formatYMD(now)) > new Date(formatYMD(endDate))) {
        plan.is_active = false;
        plan.status = "completed";
        await plan.save();
      }
      return;
    }

    // 2) Check exclusions
    if (excluded.includes(todayStr)) {
      return;
    }

    // 3) Check time (unlock_time or default 06:00)
    const unlockAt = buildTodayAtTime(plan.unlock_time || "06:00");
    if (now < unlockAt) {
      // not yet time
      return;
    }

    // 4) Check next_unlock_at to avoid double unlocking same day
    if (plan.next_unlock_at) {
      const nextUnlockDateStr = formatYMD(plan.next_unlock_at);
      if (nextUnlockDateStr === todayStr) {
        // it means we already set today as next; but we must check time:
        if (now < plan.next_unlock_at) {
          return;
        }
      } else {
        // if next_unlock_at is in the future (after today), don't unlock
        if (plan.next_unlock_at > now) {
          return;
        }
      }
    }

    // 5) Unlock amount
    const unlockAmount =
      plan.daily_unlock_amount && plan.daily_unlock_amount > 0
        ? plan.daily_unlock_amount
        : Math.round(plan.amount_locked / 30);

    const realUnlock = Math.min(unlockAmount, plan.remaining_amount);

    if (realUnlock <= 0) return;

    // Get wallet
    const wallet = await Wallet.findOne({ userId: plan.userId });
    if (!wallet) return;

    // Update wallet
    wallet.balance += realUnlock;
    await wallet.save();

    // Update plan remaining
    plan.remaining_amount -= realUnlock;
    plan.updated_at = new Date();

    if (plan.remaining_amount <= 0) {
      plan.remaining_amount = 0;
      plan.is_active = false;
      plan.status = "completed";
    } else {
      // compute next unlock date (next valid non-excluded day in range)
      const nextDate = getNextValidDailyDate(plan, now);
      if (nextDate) {
        const [hh, mm] = (plan.unlock_time || "06:00").split(":");
        nextDate.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
        plan.next_unlock_at = nextDate;
      } else {
        plan.is_active = false;
        plan.status = "completed";
      }
    }

    await plan.save();

    // Log transaction
    await Transaction.create({
      userId: plan.userId,
      type: "unlock",
      amount: realUnlock,
      currency: "RWF",
      planId: plan._id,
      created_at: new Date(),
    });

    console.log(
      `✅ Daily unlock: plan=${plan._id}, user=${plan.userId}, amount=${realUnlock}`
    );
  } catch (err) {
    console.error("Daily Unlock Error:", err.message);
  }
}

// ───────────────────────────────
// FIXED PLAN UNLOCK
// ───────────────────────────────
async function processFixedPlan(plan) {
  try {
    if (!plan.is_active || plan.status !== "active") return;
    if (!plan.unlock_date) return;

    const now = new Date();
    const unlockDate = new Date(plan.unlock_date);

    // Build unlock datetime = unlock_date + unlock_time
    const [hh, mm] = (plan.unlock_time || "06:00").split(":");
    unlockDate.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);

    if (now < unlockDate) {
      // Not yet time
      return;
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId: plan.userId });
    if (!wallet) return;

    const amount = plan.amount_locked || 0;
    if (amount <= 0) {
      plan.is_active = false;
      plan.status = "completed";
      await plan.save();
      return;
    }

    // Unlock entire amount
    wallet.balance += amount;
    await wallet.save();

    plan.is_active = false;
    plan.status = "completed";
    plan.updated_at = new Date();
    await plan.save();

    await Transaction.create({
      userId: plan.userId,
      type: "unlock",
      amount,
      currency: "RWF",
      planId: plan._id,
      created_at: new Date(),
    });

    console.log(
      `✅ Fixed unlock: plan=${plan._id}, user=${plan.userId}, amount=${amount}`
    );
  } catch (err) {
    console.error("Fixed Unlock Error:", err.message);
  }
}

// ───────────────────────────────
// GOAL PLAN UNLOCK
// ───────────────────────────────
async function processGoalPlan(plan) {
  try {
    if (!plan.is_active || plan.status !== "active") return;
    if (!plan.goal_target) return;

    const progress = plan.progress || 0;
    const target = plan.goal_target;

    // Only unlock when progress >= target
    if (progress < target) {
      return;
    }

    // Get wallet
    const wallet = await Wallet.findOne({ userId: plan.userId });
    if (!wallet) return;

    const amount = plan.amount_locked || progress;

    if (amount <= 0) {
      plan.is_active = false;
      plan.status = "completed";
      plan.is_goal_met = true;
      await plan.save();
      return;
    }

    // Unlock to wallet
    wallet.balance += amount;
    await wallet.save();

    plan.is_active = false;
    plan.status = "completed";
    plan.is_goal_met = true;
    plan.updated_at = new Date();
    await plan.save();

    await Transaction.create({
      userId: plan.userId,
      type: "unlock",
      amount,
      currency: "RWF",
      planId: plan._id,
      created_at: new Date(),
    });

    console.log(
      `✅ Goal unlock: plan=${plan._id}, user=${plan.userId}, amount=${amount}`
    );
  } catch (err) {
    console.error("Goal Unlock Error:", err.message);
  }
}

// ───────────────────────────────
// MAIN ENGINE: RUN UNLOCK CHECK
// ───────────────────────────────
exports.runUnlockEngine = async (req, res) => {
  try {
    const now = new Date();
    console.log("⏱ Unlock Engine Tick at:", now.toISOString());

    // Get all active plans
    const activePlans = await Plan.find({ is_active: true });

    for (const plan of activePlans) {
      if (plan.plan_type === "daily") {
        await processDailyPlan(plan);
      } else if (plan.plan_type === "fixed") {
        await processFixedPlan(plan);
      } else if (plan.plan_type === "goal") {
        await processGoalPlan(plan);
      }
    }

    if (res) {
      // If called via HTTP route
      return res.status(200).json({
        success: true,
        message: "Unlock engine executed",
        checked_plans: activePlans.length,
      });
    }
  } catch (err) {
    console.error("Unlock Engine Error:", err.message);
    if (res) {
      return res.status(500).json({
        success: false,
        message: "Unlock engine error",
      });
    }
  }
};
