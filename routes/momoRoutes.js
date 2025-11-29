// routes/momoRoutes.js
const express = require("express");
const router = express.Router();
const momoController = require("../controllers/momoController");

// ------------------------------------------------------
// GET MTN ACCESS TOKEN (Optional - Debug/Test)
// ------------------------------------------------------
router.post("/token", momoController.getToken);

// ------------------------------------------------------
// INITIATE REQUEST TO PAY (Deposit via MoMo)
// POST /momo/collect
// ------------------------------------------------------
router.post("/collect", momoController.requestToPay);

// ------------------------------------------------------
// MTN CALLBACK ENDPOINT (You set this in MTN portal)
// POST /momo/callback
// ------------------------------------------------------
router.post("/callback", momoController.handleCallback);

module.exports = router;
