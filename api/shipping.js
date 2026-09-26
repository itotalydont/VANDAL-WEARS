export default async function handler(req, res) {
  // Allow requests from the VANDAL website
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Quick test
  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "VANDAL shipping backend is working.",
      shipbubbleKeyLoaded: Boolean(process.env.SHIPBUBBLE_API_KEY)
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed."
    });
  }

  try {
    if (!process.env.SHIPBUBBLE_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Shipbubble API key is not configured."
      });
    }

    const {
      name,
      email,
      phone,
      address,
      latitude,
      longitude
    } = req.body || {};

    if (!name || !email || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone and address are required."
      });
    }

    const shipbubbleResponse = await fetch(
      "https://api.shipbubble.com/v1/shipping/address/validate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          ...(latitude != null ? { latitude } : {}),
          ...(longitude != null ? { longitude } : {})
        })
      }
    );

    const data = await shipbubbleResponse.json();

    return res.status(shipbubbleResponse.status).json(data);

  } catch (error) {
    console.error("Shipping API error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to contact Shipbubble.",
      error: error.message
    });
  }
}
