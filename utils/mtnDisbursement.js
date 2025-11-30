// utils/mtnDisbursement.js

const axios = require("axios");
const uuid = require("uuid");
require("dotenv").config();

const MOMO_ENV = process.env.MTN_ENV || "sandbox";

// Base URLs for MTN API
const BASE_URL = MOMO_ENV === "sandbox"
  ? "https://sandbox.momodeveloper.mtn.com"
  : "https://momodeveloper.mtn.com";

// ENV variables
const API_USER = process.env.MTN_API_USER;
const API_KEY = process.env.MTN_API_KEY;
const SUBSCRIPTION_KEY = process.env.MTN_DISBURSEMENT_KEY; // <-- IMPORTANT
const CALLBACK_URL = process.env.MTN_CALLBACK_URL;


// -------------------------------------------------------------
// 1. GENERATE ACCESS TOKEN
// -------------------------------------------------------------
async function getAccessToken() {
  try {
    const response = await axios({
      method: "post",
      url: `${BASE_URL}/disbursement/token/`,
      headers: {
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        Authorization: `Basic ${Buffer.from(`${API_USER}:${API_KEY}`).toString("base64")}`,
      },
    });

    return response.data.access_token;
  } catch (err) {
    console.error("MoMo Access Token Error:", err.response?.data || err.message);
    throw new Error("MoMo Access Token Failed");
  }
}



// -------------------------------------------------------------
// 2. SEND MONEY TO USER (DISBURSEMENT)
// -------------------------------------------------------------
async function sendMoney({ amount, phoneNumber, externalId }) {
  try {
    const token = await getAccessToken();
    const referenceId = uuid.v4(); // MTN requires UUID for transfer

    const payload = {
      amount: String(amount),
      currency: "RWF",
      externalId: externalId || "CashLock-Withdrawal",
      payee: {
        partyIdType: "MSISDN",
        partyId: phoneNumber, // 2507XXXXXXXX
      },
      payerMessage: "CashLock Withdrawal",
      payeeNote: "CashLock Funds",
    };

    await axios({
      method: "post",
      url: `${BASE_URL}/disbursement/v1_0/transfer`,
      data: payload,
      headers: {
        "X-Reference-Id": referenceId,
        "X-Target-Environment": MOMO_ENV,
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return referenceId;
  } catch (err) {
    console.error("MoMo Send Money Error:", err.response?.data || err.message);
    throw new Error("MoMo Transfer Failed");
  }
}



// -------------------------------------------------------------
// 3. CHECK DISBURSEMENT STATUS (OPTIONAL)
// -------------------------------------------------------------
async function getTransferStatus(referenceId) {
  try {
    const token = await getAccessToken();

    const response = await axios({
      method: "get",
      url: `${BASE_URL}/disbursement/v1_0/transfer/${referenceId}`,
      headers: {
        "X-Target-Environment": MOMO_ENV,
        "Ocp-Apim-Subscription-Key": SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (err) {
    console.error("MoMo Transfer Status Error:", err.response?.data || err.message);
    throw new Error("MoMo Status Check Failed");
  }
}


module.exports = {
  getAccessToken,
  sendMoney,
  getTransferStatus,
};
