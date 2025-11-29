// routes/momoRoutes.js
const express = require("express");
const router = express.Router();
const momoController = require("../controllers/momoController");

// Get token (optional / for testing)
router.post("/token", momoController.getToken);

// Initiate deposit (RequestToPay)
router.post("/collect", momoController.requestToPay);

// MTN callback
router.post("/callback", momoController.handleCallback);

module.exports = router;
