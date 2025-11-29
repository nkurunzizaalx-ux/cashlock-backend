const express = require("express");
const router = express.Router();
const walletController = require("../controllers/walletController");

router.post("/deposit", walletController.manualDeposit);

module.exports = router;
