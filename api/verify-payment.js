export default async function handler(req, res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  if (req.method === "OPTIONS") {

    return res
      .status(200)
      .end();

  }


  if (req.method !== "POST") {

    return res
      .status(405)
      .json({

        success: false,

        message:
          "Use POST to verify a payment."

      });

  }


  const SECRET_KEY =
    process.env.FLW_SECRET_KEY;


  if (!SECRET_KEY) {

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Flutterwave secret key is not configured."

      });

  }


  try {

    const {

      transaction_id,

      tx_ref,

      expected_amount,

      expected_currency

    } = req.body || {};


    if (
      !transaction_id ||
      !tx_ref ||
      expected_amount === undefined ||
      !expected_currency
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Missing payment verification information."

        });

    }


    const expectedAmount =
      Number(expected_amount);


    if (
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount <= 0
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Invalid expected payment amount."

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


    const expectedCurrency =
      String(
        expected_currency
      )
        .trim()
        .toUpperCase();


    if (
      !allowedCurrencies.includes(
        expectedCurrency
      )
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Invalid payment currency."

        });

    }


    const response =
      await fetch(

        `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transaction_id)}/verify`,

        {

          method:
            "GET",

          headers: {

            "Content-Type":
              "application/json",

            "Accept":
              "application/json",

            Authorization:
              `Bearer ${SECRET_KEY}`

          }

        }

      );


    const responseText =
      await response.text();


    let flutterwave;


    try {

      flutterwave =
        JSON.parse(
          responseText
        );

    } catch (error) {

      console.error(
        "Flutterwave returned non-JSON:",
        responseText
      );


      return res
        .status(502)
        .json({

          success: false,

          message:
            "Flutterwave returned an invalid response."

        });

    }


    if (
      !response.ok ||
      flutterwave.status !==
        "success" ||
      !flutterwave.data
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            flutterwave.message ||
            "Flutterwave could not verify this transaction."

        });

    }


    const transaction =
      flutterwave.data;


    const actualAmount =
      Number(
        transaction.amount
      );


    const actualCurrency =
      String(
        transaction.currency ||
        ""
      )
        .trim()
        .toUpperCase();


    const referenceMatches =

      transaction.tx_ref ===
      tx_ref;


    const statusMatches =

      transaction.status ===
      "successful";


    const currencyMatches =

      actualCurrency ===
      expectedCurrency;


    /*
    Flutterwave recommends checking
    that amount paid is at least the
    amount expected.
    */

    const amountMatches =

      Number.isFinite(
        actualAmount
      )

      &&

      actualAmount >=
      expectedAmount;


    if (
      !referenceMatches ||
      !statusMatches ||
      !currencyMatches ||
      !amountMatches
    ) {

      console.error(
        "Payment verification mismatch:",
        {

          expected: {

            tx_ref:
              tx_ref,

            amount:
              expectedAmount,

            currency:
              expectedCurrency

          },

          actual: {

            tx_ref:
              transaction.tx_ref,

            amount:
              actualAmount,

            currency:
              actualCurrency,

            status:
              transaction.status

          }

        }
      );


      return res
        .status(400)
        .json({

          success: false,

          message:
            "Payment details did not match this order."

        });

    }


    return res
      .status(200)
      .json({

        success: true,

        message:
          "Payment verified successfully.",

        transaction: {

          id:
            transaction.id,

          tx_ref:
            transaction.tx_ref,

          amount:
            actualAmount,

          currency:
            actualCurrency,

          status:
            transaction.status

        }

      });


  } catch (error) {

    console.error(
      "VANDAL payment verification error:",
      error
    );


    return res
      .status(500)
      .json({

        success: false,

        message:
          "Unable to verify payment."

      });

  }

}
