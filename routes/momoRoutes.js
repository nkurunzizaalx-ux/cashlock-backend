// routes/momoRoutes.js

const express = require("express");
const router = express.Router();
const momoCallbackController = require("../controllers/momoCallbackController");

// MTN sends callback here after withdrawal is processed
router.post("/withdraw/callback", momoCallbackController.handleWithdrawalCallback);

module.exports = router;
