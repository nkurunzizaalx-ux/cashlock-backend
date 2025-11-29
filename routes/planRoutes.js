
const express = require("express");
const router = express.Router();
const planController = require("../controllers/planController");

// CREATE LOCK PLAN
router.post("/create", planController.createPlan);

module.exports = router;
