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
    const externalId = uuidv4();
    const referenceId = uuidv4();

    // 1) Get access token for Collections
    const accessToken = await getCollectionsToken();

    // 2) Call MTN RequestToPay (SANDBOX REQUIRES EUR)
    const requestBody = {
      amount: amount.toString(),
      currency: "EUR", // ⭐ MTN SANDBOX ONLY SUPPORTS EUR FOR COLLECTIONS
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
        "X-Callback-Url": callbackUrl,
      },
    });

    // 3) Create Transaction (stored as EUR for sandbox)
    await Transaction.create({
      userId,
      type: "deposit",
      amount,
      currency: "EUR", // ⭐ MUST MATCH REQUEST BODY
      externalId,
      referenceId,
      momo_status: "PENDING",
    });

    // 4) Respond with referenceId
    return res.status(200).json({
      message: "Deposit initiated successfully in sandbox.",
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
