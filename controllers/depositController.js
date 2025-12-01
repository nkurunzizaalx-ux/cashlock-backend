// controllers/depositController.js

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/Transaction");

/**
 * Helper: Get MTN Collections Access Token
 */
async function getCollectionsToken() {
  try {
    const apiUser = process.env.MTN_API_USER;
    const apiKey = process.env.MTN_API_KEY;
    const subscriptionKey = process.env.MTN_COLLECTION_KEY;
    const env = process.env.MTN_ENV || "sandbox";

    if (!apiUser || !apiKey || !subscriptionKey) {
      throw new Error("Missing MTN Collections credentials");
    }

    const baseUrl =
      env === "sandbox"
        ? "https://sandbox.momodeveloper.mtn.com"
        : "https://momodeveloper.mtn.com";

    const tokenUrl = `${baseUrl}/collection/token/`;

    const authHeader =
      "Basic " + Buffer.from(`${apiUser}:${apiKey}`).toString("base64");

    const response = await axios.post(
      tokenUrl,
      {},
      {
        headers: {
          Authorization: authHeader,
          "Ocp-Apim-Subscription-Key": subscriptionKey,
        },
      }
    );

    if (!response.data?.access_token) {
      throw new Error("MTN did not return access_token");
    }

    return response.data.access_token;
  } catch (error) {
    console.error("🔥 Token Error:", error.response?.data || error.message);
    throw new Error("Failed to get MTN Collections token");
  }
}

/**
 * POST /api/deposit/initiate
 */
exports.initiateDeposit = async (req, res) => {
  try {
    const { userId, amount, phone } = req.body;

    if (!userId || !amount || !phone) {
      return res.status(400).json({
        message: "userId, amount and phone are required",
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    const env = process.env.MTN_ENV || "sandbox";
    const subscriptionKey = process.env.MTN_COLLECTION_KEY;
    const callbackUrl =
      process.env.MTN_COLLECTION_CALLBACK_URL ||
      "http://localhost:3000/momo-callback/deposit/callback";

    const baseUrl =
      env === "sandbox"
        ? "https://sandbox.momodeveloper.mtn.com"
        : "https://momodeveloper.mtn.com";

    const externalId = uuidv4();
    const referenceId = uuidv4();

    // 1️⃣ Auth token
    const accessToken = await getCollectionsToken();

    // 2️⃣ Request-To-Pay body (sandbox uses EUR)
    const requestBody = {
      amount: amount.toString(),
      currency: "EUR",
      externalId: externalId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phone,
      },
      payerMessage: "CashLock wallet deposit",
      payeeNote: "CashLock deposit",
    };

    // 3️⃣ Send RequestToPay
    await axios.post(`${baseUrl}/collection/v1_0/requesttopay`, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": env,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
        // Used for production later — sandbox often ignores it, but harmless.
        "X-Callback-Url": callbackUrl,
      },
    });

    // 4️⃣ Save transaction as PENDING
    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency: "EUR",
      externalId,
      referenceId,
      momo_status: "PENDING",
    });

    return res.status(200).json({
      message: "Deposit initiated successfully in sandbox.",
      referenceId,
    });
  } catch (error) {
    console.error("🔥 Deposit Error:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Failed to initiate deposit",
      error: error.response?.data || error.message,
    });
  }
};
