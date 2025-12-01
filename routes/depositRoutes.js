// routes/depositRoutes.js

const express = require("express");
const router = express.Router();

const { initiateDeposit } = require("../controllers/depositController");

// POST /api/deposit/initiate
router.post("/initiate", initiateDeposit);

module.exports = router;
