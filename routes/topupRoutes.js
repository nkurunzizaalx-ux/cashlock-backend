// --------------------------------------------
// TOP-UP ROUTES
// --------------------------------------------

const express = require("express");
const router = express.Router();
const topupController = require("../controllers/topupController");

// --------------------------------------------
// POST /api/topup
// Top up a GOAL plan
// --------------------------------------------
router.post("/", topupController.topUpGoalPlan);

module.exports = router;
