const express = require("express");
const router = express.Router();
const topupController = require("../controllers/topupController");

// ------------------------------------------------------
// TOP-UP GOAL PLAN
// POST /api/topup
// ------------------------------------------------------
router.post("/", topupController.topUpGoalPlan);

module.exports = router;
