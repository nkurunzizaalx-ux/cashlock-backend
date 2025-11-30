async function sendMoney({ amount, phoneNumber, externalId }) {
  try {
    const token = await getAccessToken();
    const referenceId = uuid.v4();

    const payload = {
      amount: String(amount),
      currency: "RWF",
      externalId: externalId || "CashLock-Withdrawal",
      payee: {
        partyIdType: "MSISDN",
        partyId: phoneNumber,
      },
      payerMessage: "CashLock Withdrawal",
      payeeNote: "CashLock Funds",
    };

    const response = await axios({
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
      validateStatus: () => true  // IMPORTANT: allow us to inspect 202
    });

    // MTN SUCCESS = HTTP 202
    if (response.status === 202) {
      console.log("MTN Transfer Accepted (202):", referenceId);
      return referenceId;
    }

    // Anything else = actual failure
    console.error("MoMo Transfer Error:", response.data || response.status);
    throw new Error("MoMo Transfer Failed");

  } catch (err) {
    console.error("MoMo Transfer Exception:", err.response?.data || err.message);
    throw new Error("MoMo Transfer Failed");
  }
}