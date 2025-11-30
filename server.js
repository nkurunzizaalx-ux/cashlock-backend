const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");

// ------------------------------------------------------
// PREVIEW LOCK PLAN
// ------------------------------------------------------
router.post("/preview", planController.previewPlan);

// ------------------------------------------------------
// CREATE LOCK PLAN
// ------------------------------------------------------
router.post("/create", planController.createPlan);

// ------------------------------------------------------
// GET ALL PLANS FOR A USER
// ------------------------------------------------------
router.get("/user/:userId", planController.getUserPlans);

// ------------------------------------------------------
// UPDATE PLAN (Goal progress, unlock_time, unlock_date, etc.)
// ------------------------------------------------------
router.put("/update/:planId", planController.updatePlan);

module.exports = router;
