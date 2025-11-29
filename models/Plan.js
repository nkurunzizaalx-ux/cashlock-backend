const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  plan_type: { type: String, enum: ["daily", "fixed", "goal"], required: true },
  plan_name: { type: String },

  amount_locked: { type: Number, required: true },

  start_date: { type: Date, required: true },

  unlock_time: { type: String, default: "06:00" },

  status: { type: String, enum: ["active", "completed"], default: "active" },
  is_active: { type: Boolean, default: true },

  // DAILY PLAN
  daily_unlock_amount: { type: Number },
  remaining_amount: { type: Number },
  unlock_start_date: { type: Date },
  unlock_end_date: { type: Date },
  excluded_dates: { type: [String] },
  next_unlock_at: { type: Date },

  // FIXED PLAN
  unlock_date: { type: Date },  // only for fixed plan

  // GOAL PLAN
  goal_target: { type: Number },
  progress: { type: Number, default: 0 },
  top_up_allowed: { type: Boolean, default: true },
  max_top_up_allowed: { type: Number, default: 0 },
  is_goal_met: { type: Boolean, default: false },

  // PROFIT
  profit_rate: { type: Number, default: 1 },
  profit_amount: { type: Number, default: 0 },

  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Plan", PlanSchema);
