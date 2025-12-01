// controllers/depositController.js

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Transaction = require("../models/Transaction");

/**
 * Helper: Get MTN Collections Access Token
 * Uses the SAME MTN_API_USER and MTN_API_KEY that you already use for withdrawals.
 * Does NOT change any existing behavior.
 */
async function getCollectionsToken() {
  try {
    const apiUser = process.env.MTN_API_USER;
    const apiKey = process.env.MTN_API_KEY;
    const subscriptionKey = process.env.MTN_COLLECTION_KEY;
    const env = process.env.MTN_ENV || "sandbox";

    if (!apiUser || !apiKey || !subscriptionKey) {
      throw new Error("Missing MTN Collections credentials in .env");
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

    if (!response.data || !response.data.access_token) {
      throw new Error("No access_token returned from MTN Collections");
    }

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting MTN Collections token:", error.message);
    throw new Error("Failed to get MTN Collections token");
  }
}

/**
 * POST /api/deposit/initiate
 *
 * Body:
 * {
 *   "userId": "...",
 *   "amount": 5000,
 *   "phone": "2507XXXXXXXX"   // MSISDN in international format
 * }
 *
 * This only STARTS the deposit:
 * - Creates a Transaction with type "deposit" and status PENDING
 * - Sends RequestToPay to MTN
 * - Returns referenceId to the frontend
 *
 * Wallet balance will be updated later in the callback controller.
 */
exports.initiateDeposit = async (req, res) => {
  try {
    const { userId, amount, phone } = req.body;

    // Basic validation
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

    // Generate IDs
    const externalId = uuidv4(); // For your own tracking
    const referenceId = uuidv4(); // Used as X-Reference-Id and to match callback

    // 1) Get access token for Collections
    const accessToken = await getCollectionsToken();

    // 2) Call MTN RequestToPay
    const requestBody = {
      amount: amount.toString(),
      currency: "RWF", // Keep same as your app currency
      externalId: externalId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phone,
      },
      payerMessage: "CashLock wallet deposit",
      payeeNote: "CashLock deposit",
    };

    await axios.post(`${baseUrl}/collection/v1_0/requesttopay`, requestBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": env,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "Content-Type": "application/json",
        "X-Callback-Url": callbackUrl, // Some setups use this; if ignored, no issue
      },
    });

    // 3) Create Transaction with PENDING status
    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency: "RWF",
      externalId,
      referenceId,
      momo_status: "PENDING",
    });

    // 4) Respond to frontend with referenceId
    return res.status(200).json({
      message: "Deposit initiated. Please approve the MoMo prompt on your phone.",
      referenceId,
    });
  } catch (error) {
    console.error("Error initiating deposit:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Failed to initiate deposit",
      error: error.response?.data || error.message,
    });
  }
};
