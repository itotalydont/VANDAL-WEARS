export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!process.env.SHIPBUBBLE_API_KEY) {
    return res.status(500).json({
      success: false,
      message: "Shipbubble API key is not configured."
    });
  }

  // TEMPORARY TEST:
  // Opening /api/shipping in your browser will validate
  // VANDAL's sender address with Shipbubble.
  if (req.method === "GET") {
    try {
      const response = await fetch(
        "https://api.shipbubble.com/v1/shipping/address/validate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SHIPBUBBLE_API_KEY}`
          },
          body: JSON.stringify({
            name: "Valntine Ashia",
            email: "wearsvandal@gmail.com",
            phone: "+2349034982665",
            address:
              "816A Rev. Emmanuel Adubifa Street, Ikeja, Lagos, Nigeria"
          })
        }
      );

      const data = await response.json();

      return res.status(response.status).json({
        test: "VANDAL sender address",
        shipbubbleStatus: response.status,
        shipbubbleResponse: data
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Could not connect to Shipbubble.",
        error: error.message
      });
    }
  }

  // Customer address validation
  if (req.method === "POST") {
    try {
      const { name, email, phone, address, latitude, longitude } =
        req.body || {};

      if (!name || !email || !phone || !address) {
        return res.status(400).json({
          success: false,
          message: "Name, email, phone and address are required."
        });
      }

      const response = await fetch(
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

      const data = await response.json();

      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Could not connect to Shipbubble.",
        error: error.message
      });
    }
  }

  return res.status(405).json({
    success: false,
    message: "Method not allowed."
  });
}
