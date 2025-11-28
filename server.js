// -------------------------------
//   CashLock Backend - MTN MoMo
// -------------------------------

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// ROOT ROUTE
// -------------------------------
app.get("/", (req, res) => {
  res.send("🔥 CashLock Backend is Running Successfully! 🚀");
});

// -------------------------------
// TEST ROUTE
// -------------------------------
app.get("/api/test", (req, res) => {
  res.json({ message: "CashLock API test working!" });
});

// -------------------------------
// MTN TOKEN GENERATION
// -------------------------------
app.post("/momo/token", async (req, res) => {
  try {
    const user = process.env.MTN_API_USER;
    const apiKey = process.env.MTN_API_KEY;
    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;

    const auth = Buffer.from(`${user}:${apiKey}`).toString("base64");

    const response = await axios({
      method: "post",
      url: "https://sandbox.momodeveloper.mtn.com/collection/token/",
      headers: {
        Authorization: `Basic ${auth}`,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });

    res.json({
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    });
  } catch (err) {
    console.error("Token Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate token" });
  }
});

// -------------------------------
// MTN REQUEST TO PAY (COLLECT)
// -------------------------------
app.post("/momo/collect", async (req, res) => {
  try {
    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    const callbackUrl = process.env.MTN_CALLBACK_URL;

    const { amount, phone, externalId } = req.body;

<<<<<<< HEAD
    // Unique reference for each transaction
    const referenceId = uuidv4();

    // 1️⃣ Generate token
=======
    const referenceId = uuidv4();

>>>>>>> 25f7807e71284feda2a5c1940539d90469e3e440
    const tokenResponse = await axios({
      method: "post",
      url: "https://sandbox.momodeveloper.mtn.com/collection/token/",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.MTN_API_USER}:${process.env.MTN_API_KEY}`
          ).toString("base64"),
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    });

    const accessToken = tokenResponse.data.access_token;

<<<<<<< HEAD
    // 2️⃣ Request to pay
=======
>>>>>>> 25f7807e71284feda2a5c1940539d90469e3e440
    await axios({
      method: "post",
      url: "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "sandbox",
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
        "X-Callback-Url": callbackUrl,
      },
      data: {
        amount: amount,
        currency: "EUR",
        externalId: externalId || "cashlock-payment",
        payer: {
          partyIdType: "MSISDN",
          partyId: phone,
        },
        payerMessage: "CashLock payment",
        payeeNote: "CashLock lock plan",
      },
    });

<<<<<<< HEAD
    // 3️⃣ Response to app
=======
>>>>>>> 25f7807e71284feda2a5c1940539d90469e3e440
    res.json({
      status: "pending",
      referenceId,
      message: "Payment request sent to MTN MoMo",
    });
  } catch (err) {
    console.error("Collect Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Payment request failed" });
  }
});

// -------------------------------
// MTN CALLBACK ENDPOINT
// -------------------------------
app.post("/momo/callback", async (req, res) => {
  try {
    console.log("📥 MTN CALLBACK RECEIVED:");
    console.log(req.body);

<<<<<<< HEAD
    // Example:
    // {
    //   status: "SUCCESSFUL" | "FAILED" | ...
    //   amount: "1000",
    //   externalId: "cashlock-payment",
    //   financialTransactionId: "xxxx",
    // }

    // TODO:
    // Save to DB later (Firestore or MongoDB)
    // Update user lock plan
    // Notify the user

=======
>>>>>>> 25f7807e71284feda2a5c1940539d90469e3e440
    res.status(200).send("Callback received");
  } catch (err) {
    console.error("Callback Error:", err.message);
    res.status(500).send("Callback processing error");
  }
});

// -------------------------------
// START SERVER
// -------------------------------
<<<<<<< HEAD
const PORT = process.env.PORT || 3000;
=======
const PORT = process.env.PORT || 10000;
>>>>>>> 25f7807e71284feda2a5c1940539d90469e3e440
app.listen(PORT, () => {
  console.log(`🚀 CashLock backend running on port ${PORT}`);
});
