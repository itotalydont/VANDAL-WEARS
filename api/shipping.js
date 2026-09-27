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
      message: "Use POST to request shipping rates."
    });
  }

  const API_KEY = process.env.SHIPBUBBLE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({
      success: false,
      message: "Shipbubble API key is not configured."
    });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`
  };

  try {
    const {
      name,
      email,
      phone,
      address,
      cart
    } = req.body || {};

    // -----------------------------
    // 1. CHECK CUSTOMER INFORMATION
    // -----------------------------

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name, email, phone number and shipping address are required."
      });
    }

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty."
      });
    }

    // -----------------------------
    // 2. PRODUCT SHIPPING WEIGHTS
    // -----------------------------

    const productWeights = {
      "VANDAL JERSEY": 0.4,
      "VANDAL TEE": 0.4,
      "KOM TEE": 0.4,
      "QUEEN BABY TEE": 0.4,

      "DOUBLE WAIST": 0.8,
      "VANDAL shorts V1": 0.8,
      "VANDAL shorts V2": 0.8,
      "MISCHIEF SWEATS": 0.8,
      "FEM FOLDOVER SWEATS": 0.8,

      "FEM SHORTS": 0.2,
      "BEANIE": 0.2
    };

    // -----------------------------
    // 3. BUILD SHIPBUBBLE ITEMS
    // -----------------------------

    const packageItems = cart.map((item) => {
      const weight = productWeights[item.name];

      if (!weight) {
        throw new Error(
          `Shipping weight has not been set for ${item.name}.`
        );
      }

      const quantity = Number(item.quantity || item.qty || 1);
      const price = Number(item.price || 0);

      if (!Number.isFinite(price) || price <= 0) {
        throw new Error(
          `Invalid price for ${item.name}.`
        );
      }

      return {
        name: item.name,
        description: `VANDAL ${item.name}`,
        unit_weight: String(weight),
        unit_amount: String(price),
        quantity: String(quantity)
      };
    });

    // -----------------------------
    // 4. VALIDATE CUSTOMER ADDRESS
    // -----------------------------

    const receiverResponse = await fetch(
      "https://api.shipbubble.com/v1/shipping/address/validate",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name,
          email,
          phone,
          address
        })
      }
    );

    const receiverData = await receiverResponse.json();

    if (
      !receiverResponse.ok ||
      receiverData.status !== "success" ||
      !receiverData.data?.address_code
    ) {
      return res.status(422).json({
        success: false,
        message: "We could not validate the delivery address.",
        shipbubble: receiverData
      });
    }

    const receiverAddressCode =
      receiverData.data.address_code;

    // -----------------------------
    // 5. VALIDATE VANDAL PICKUP ADDRESS
    // -----------------------------

    const senderResponse = await fetch(
      "https://api.shipbubble.com/v1/shipping/address/validate",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: "Valntine Ashia",
          email: "wearsvandal@gmail.com",
          phone: "+2349034982665",
          address:
            "816A Rev. Emmanuel Adubifa Street, Ikeja, Lagos, Nigeria"
        })
      }
    );

    const senderData = await senderResponse.json();

    if (
      !senderResponse.ok ||
      senderData.status !== "success" ||
      !senderData.data?.address_code
    ) {
      return res.status(500).json({
        success: false,
        message: "VANDAL pickup address could not be validated.",
        shipbubble: senderData
      });
    }

    const senderAddressCode =
      senderData.data.address_code;

    // -----------------------------
    // 6. PICKUP DATE
    // Use tomorrow to avoid same-day cutoff issues.
    // -----------------------------

    const pickupDate = new Date();
    pickupDate.setDate(pickupDate.getDate() + 1);

    const pickupDateString =
      pickupDate.toISOString().split("T")[0];

    // -----------------------------
    // 7. ASK SHIPBUBBLE FOR LIVE RATES
    // -----------------------------

    const rateResponse = await fetch(
      "https://api.shipbubble.com/v1/shipping/fetch_rates",
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          sender_address_code: senderAddressCode,

          // Shipbubble spells this field "reciever"
          reciever_address_code: receiverAddressCode,

          pickup_date: pickupDateString,

          // Fashion wears
          category_id: 98246239,

          package_items: packageItems,

          package_dimension: {
            length: 40,
            width: 12,
            height: 5
          }
        })
      }
    );

    const rateData = await rateResponse.json();

    if (!rateResponse.ok || rateData.status !== "success") {
      return res.status(rateResponse.status || 400).json({
        success: false,
        message: "Shipbubble could not retrieve shipping rates.",
        shipbubble: rateData
      });
    }

    // -----------------------------
    // 8. SEND RATES BACK TO CHECKOUT
    // -----------------------------

    return res.status(200).json({
      success: true,

      validated_address: {
        address_code: receiverAddressCode,
        formatted_address:
          receiverData.data.formatted_address,
        country: receiverData.data.country,
        state: receiverData.data.state,
        city: receiverData.data.city
      },

      request_token: rateData.data.request_token,

      couriers: rateData.data.couriers,

      cheapest_courier:
        rateData.data.cheapest_courier,

      fastest_courier:
        rateData.data.fastest_courier
    });

  } catch (error) {
    console.error("VANDAL shipping error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to calculate shipping.",
      error: error.message
    });
  }
}
