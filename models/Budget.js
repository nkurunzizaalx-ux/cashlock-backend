const mongoose = require("mongoose");

const BudgetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },

  title: { type: String, required: true },
  amount: { type: Number, required: true },
  priority: { 
    type: String, 
    enum: ["low", "medium", "high"], 
    default: "medium" 
  },

  due_date: { type: Date },      
  notes: { type: String },       

  is_done: { type: Boolean, default: false },

  month: { type: String, required: true },  
  // format: "2025-11"

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Budget", BudgetSchema);
