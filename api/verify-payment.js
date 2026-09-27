export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Use POST to verify a payment."
    });
  }

  const SECRET_KEY = process.env.FLW_SECRET_KEY;

  if (!SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "Flutterwave secret key is not configured."
    });
  }

  try {
    const {
      transaction_id,
      tx_ref,
      expected_amount
    } = req.body || {};

    if (!transaction_id || !tx_ref || expected_amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification information."
      });
    }

    const expectedAmount = Number(expected_amount);

    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid expected payment amount."
      });
    }

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SECRET_KEY}`
        }
      }
    );

    const flutterwave = await response.json();

    if (!response.ok || flutterwave.status !== "success" || !flutterwave.data) {
      return res.status(400).json({
        success: false,
        message: "Flutterwave could not verify this transaction."
      });
    }

    const transaction = flutterwave.data;

    const paymentIsValid =
      transaction.status === "successful" &&
      transaction.tx_ref === tx_ref &&
      transaction.currency === "NGN" &&
      Number(transaction.amount) >= expectedAmount;

    if (!paymentIsValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully.",
      transaction: {
        id: transaction.id,
        tx_ref: transaction.tx_ref,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status
      }
    });

  } catch (error) {
    console.error("VANDAL payment verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment."
    });
  }
}
