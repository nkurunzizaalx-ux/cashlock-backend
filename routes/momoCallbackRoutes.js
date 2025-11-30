// routes/momoCallbackRoutes.js

const express = require("express");
const router = express.Router();

const { handleWithdrawalCallback } = require("../controllers/momoCallbackController");

router.post("/withdraw/callback", handleWithdrawalCallback);

module.exports = router;
