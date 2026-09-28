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

  const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

  if (!FLW_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "Flutterwave secret key is not configured."
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "Order database is not configured."
    });
  }

  try {
    const {
      transaction_id,
      tx_ref,
      expected_amount,
      expected_currency,
      order
    } = req.body || {};

    if (
      !transaction_id ||
      !tx_ref ||
      expected_amount === undefined ||
      !expected_currency ||
      !order
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment or order information."
      });
    }

    const expectedAmount = Number(expected_amount);

    if (
      !Number.isFinite(expectedAmount) ||
      expectedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid expected payment amount."
      });
    }

    const allowedCurrencies = [
      "NGN",
      "USD",
      "GBP",
      "EUR",
      "CAD",
      "GHS"
    ];

    const expectedCurrency = String(expected_currency)
      .trim()
      .toUpperCase();

    if (!allowedCurrencies.includes(expectedCurrency)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment currency."
      });
    }

    /* =========================
       VERIFY WITH FLUTTERWAVE
    ========================= */

    const flwResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(
        transaction_id
      )}/verify`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${FLW_SECRET_KEY}`
        }
      }
    );

    const flwText = await flwResponse.text();

    let flutterwave;

    try {
      flutterwave = JSON.parse(flwText);
    } catch {
      return res.status(502).json({
        success: false,
        message: "Flutterwave returned an invalid response."
      });
    }

    if (
      !flwResponse.ok ||
      flutterwave.status !== "success" ||
      !flutterwave.data
    ) {
      return res.status(400).json({
        success: false,
        message:
          flutterwave.message ||
          "Flutterwave could not verify this transaction."
      });
    }

    const transaction = flutterwave.data;

    const actualAmount = Number(transaction.amount);

    const actualCurrency = String(
      transaction.currency || ""
    )
      .trim()
      .toUpperCase();

    const verified =
      transaction.tx_ref === tx_ref &&
      transaction.status === "successful" &&
      actualCurrency === expectedCurrency &&
      Number.isFinite(actualAmount) &&
      actualAmount >= expectedAmount;

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: "Payment details did not match this order."
      });
    }

    /* =========================
       BUILD DATABASE ORDER
    ========================= */

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    const stickers =
      order.stickers &&
      typeof order.stickers === "object"
        ? order.stickers
        : [];

    const row = {
      order_ref: String(tx_ref),

      status: "Pending Production",

      customer_name: String(
        order.customer_name || ""
      ).trim(),

      customer_email: String(
        order.customer_email || ""
      ).trim(),

      customer_phone: String(
        order.customer_phone || ""
      ).trim(),

      delivery_address: String(
        order.delivery_address || ""
      ).trim(),

      items: items,

      stickers: stickers,

      total_stickers:
        Number(order.total_stickers) || 0,

      free_stickers:
        Number(order.free_stickers) || 0,

      paid_stickers:
        Number(order.paid_stickers) || 0,

      sticker_charge:
        Number(order.sticker_charge) || 0,

      promo_code:
        order.promo_code
          ? String(order.promo_code)
          : null,

      discount_amount:
        Number(order.discount_amount) || 0,

      courier_name:
        order.courier_name
          ? String(order.courier_name)
          : null,

      courier_service:
        order.courier_service
          ? String(order.courier_service)
          : null,

      shipping_request_token:
        order.shipping_request_token
          ? String(order.shipping_request_token)
          : null,

      shipping_fee_ngn:
        Number(order.shipping_fee_ngn) || 0,

      shipping_fee_charged:
        Number(order.shipping_fee_charged) || 0,

      currency: actualCurrency,

      amount_paid: actualAmount,

      flutterwave_transaction_id:
        String(transaction.id),

      payment_status: "verified",

      made_to_order: true
    };

    /* =========================
       CHECK ORDER DETAILS
    ========================= */

    if (
      !row.customer_name ||
      !row.customer_email ||
      !row.customer_phone ||
      !row.delivery_address ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "The order details were incomplete, so the order was not saved."
      });
    }

    /* =========================
       SAVE TO SUPABASE
    ========================= */

    const dbResponse = await fetch(
      `${SUPABASE_URL.replace(
        /\/$/,
        ""
      )}/rest/v1/orders?on_conflict=flutterwave_transaction_id`,
      {
        method: "POST",

        headers: {
          apikey: SUPABASE_SECRET_KEY,

          Authorization:
            `Bearer ${SUPABASE_SECRET_KEY}`,

          "Content-Type":
            "application/json",

          Prefer:
            "resolution=ignore-duplicates,return=representation"
        },

        body: JSON.stringify(row)
      }
    );

    const dbText = await dbResponse.text();

    if (!dbResponse.ok) {
      console.error(
        "Supabase order save failed:",
        dbText
      );

      return res.status(500).json({
        success: false,
        message:
          "Payment was verified, but the order could not be saved. Do not pay again. Contact VANDAL with your transaction reference."
      });
    }

    /* =========================
       READ SAVED ORDER
    ========================= */

    let savedOrder = null;

    try {
      const parsed = dbText
        ? JSON.parse(dbText)
        : [];

      savedOrder = Array.isArray(parsed)
        ? parsed[0] || null
        : parsed;
    } catch {
      savedOrder = null;
    }

    /* =========================
       SUCCESS
    ========================= */

    return res.status(200).json({
      success: true,

      message:
        "Payment verified and order saved successfully.",

      order_ref: tx_ref,

      saved: true,

      order: savedOrder,

      transaction: {
        id: transaction.id,
        tx_ref: transaction.tx_ref,
        amount: actualAmount,
        currency: actualCurrency,
        status: transaction.status
      }
    });
  } catch (error) {
    console.error(
      "VANDAL payment/order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify and save the order."
    });
  }
}
