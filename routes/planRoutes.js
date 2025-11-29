const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");


// ------------------------------------------------------
// PREVIEW LOCK PLAN (Fee + Total Deduction + Wallet Check)
// POST /api/plans/preview
// ------------------------------------------------------
router.post("/preview", planController.previewPlan);


// ------------------------------------------------------
// CREATE LOCK PLAN (Daily | Fixed | Goal)
// POST /api/plans/create
// ------------------------------------------------------
router.post("/create", planController.createPlan);


// ------------------------------------------------------
// GET ALL PLANS FOR A USER
// GET /api/plans/user/:userId
// ------------------------------------------------------
router.get("/user/:userId", planController.getUserPlans);


module.exports = router;
