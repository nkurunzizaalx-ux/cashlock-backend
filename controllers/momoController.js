// controllers/momoController.js
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");


// ------------------------------------------------------
// NORMALIZE PHONE (Rwanda standard)
// ------------------------------------------------------
function normalizePhone(phone) {
  if (!phone) return "";
  phone = phone.toString().replace(/\s+/g, "");

  if (phone.startsWith("+250")) phone = phone.replace("+250", "250");
  if (phone.startsWith("07")) phone = "250" + phone;

  return phone;
}


// ------------------------------------------------------
// INTERNAL – GET MTN ACCESS TOKEN
// ------------------------------------------------------
async function getAccessToken() {
  const user = process.env.MTN_API_USER;
  const apiKey = process.env.MTN_API_KEY;
  const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;

  if (!user || !apiKey || !subscriptionKey) {
    throw new Error("Missing MTN API credentials in .env");
  }

  const auth = Buffer.from(`${user}:${apiKey}`).toString("base64");

  const response = await axios.post(
    "https://sandbox.momodeveloper.mtn.com/collection/token/",
    {},
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
      },
    }
  );

  return response.data.access_token;
}


// ------------------------------------------------------
// OPTIONAL: /momo/token – GET TOKEN (debug & testing)
// ------------------------------------------------------
exports.getToken = async (req, res) => {
  try {
    const token = await getAccessToken();
    return res.json({ success: true, access_token: token });
  } catch (err) {
    console.error("MoMo Token Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to generate MTN token",
    });
  }
};



// ------------------------------------------------------
// MAIN: REQUEST TO PAY (Deposit → MoMo)
// ------------------------------------------------------
exports.requestToPay = async (req, res) => {
  try {
    let { userId, phone, amount } = req.body;

    // Normalize phone
    phone = normalizePhone(phone);

    // BASIC VALIDATION
    if (!userId || !phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "userId, phone and amount are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    const subscriptionKey = process.env.MTN_SUBSCRIPTION_KEY;
    const callbackUrl = process.env.MTN_CALLBACK_URL;

    if (!subscriptionKey || !callbackUrl) {
      return res.status(500).json({
        success: false,
        message: "Missing MTN_SUBSCRIPTION_KEY or MTN_CALLBACK_URL in .env",
      });
    }

    // 1️⃣ Generate metadata
    const referenceId = uuidv4();
    const currency = "EUR"; // Sandbox requirement

    // 2️⃣ Create pending transaction
    const transaction = await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency,
      referenceId,
      momo_status: "PENDING",
    });

    // 3️⃣ Generate MTN Access Token
    const accessToken = await getAccessToken();

    // 4️⃣ Send RequestToPay
    await axios.post(
      "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay",
      {
        amount: String(amount),
        currency,
        externalId: transaction._id.toString(),
        payer: {
          partyIdType: "MSISDN",
          partyId: phone,
        },
        payerMessage: "CashLock wallet top-up",
        payeeNote: "CashLock deposit",
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": subscriptionKey,
          "X-Callback-Url": callbackUrl,
          "Content-Type": "application/json",
        },
      }
    );

    // 5️⃣ Response to App
    return res.status(202).json({
      success: true,
      status: "PENDING",
      message: "Deposit request sent to MTN MoMo",
      referenceId,
      transactionId: transaction._id,
    });

  } catch (err) {
    console.error("MoMo RequestToPay Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate MoMo payment",
    });
  }
};



// ------------------------------------------------------
// CALLBACK: MTN → CashLock (CONFIRM PAYMENT)
// ------------------------------------------------------
exports.handleCallback = async (req, res) => {
  try {
    console.log("📥 MTN CALLBACK RECEIVED:", req.body);

    // Extract reference ID
    const referenceId =
      req.headers["x-reference-id"] ||
      req.body.referenceId ||
      req.body["referenceId"];

    const statusRaw = req.body.status || req.body.statusCode || "UNKNOWN";
    const status = String(statusRaw).toUpperCase();

    if (!referenceId) {
      console.error("Callback missing referenceId");
      return res.status(400).send("Missing referenceId");
    }

    // 1️⃣ Find transaction
    const tx = await Transaction.findOne({ referenceId });

    if (!tx) {
      console.error("No transaction found for referenceId:", referenceId);
      return res.status(404).send("Transaction not found");
    }

    // 2️⃣ Update transaction status
    tx.momo_status = status;
    await tx.save();

    // 3️⃣ On SUCCESS → credit wallet
    if (status === "SUCCESSFUL" || status === "SUCCESS") {
      const wallet = await Wallet.findOne({ userId: tx.userId });

      if (wallet) {
        wallet.balance += tx.amount;
        await wallet.save();
        console.log(
          `✅ Wallet credited: userId=${tx.userId}, amount=${tx.amount}`
        );
      } else {
        console.error("❌ Wallet not found for user:", tx.userId);
      }
    } else {
      console.log("❗ Payment not successful:", status);
    }

    return res.status(200).send("Callback processed");

  } catch (err) {
    console.error("MoMo Callback Error:", err.message);
    return res.status(500).send("Callback processing error");
  }
};
