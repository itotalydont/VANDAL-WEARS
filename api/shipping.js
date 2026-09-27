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
          "Use POST to request shipping rates."

      });

  }


  const API_KEY =
    process.env
      .SHIPBUBBLE_API_KEY;


  if (!API_KEY) {

    return res
      .status(500)
      .json({

        success: false,

        message:
          "Shipbubble API key is not configured."

      });

  }


  const headers = {

    "Content-Type":
      "application/json",

    "Accept":
      "application/json",

    Authorization:
      `Bearer ${API_KEY}`

  };


  /*
  Safely read Shipbubble.

  This prevents:
  Unexpected token '<'
  */

  async function readShipbubble(
    response,
    step
  ) {

    const text =
      await response.text();


    try {

      return JSON.parse(
        text
      );

    } catch (error) {

      console.error(
        `Shipbubble ${step} returned non-JSON:`,
        text
      );


      throw new Error(
        `Shipbubble ${step} service returned an invalid response.`
      );

    }

  }


  try {

    const {

      name,

      email,

      phone,

      address,

      cart

    } = req.body || {};


    /* =========================
       CUSTOMER DETAILS
    ========================= */

    if (
      !name ||
      !email ||
      !phone ||
      !address
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Please enter your name, email, phone number and delivery address."

        });

    }


    if (
      !Array.isArray(cart) ||
      cart.length === 0
    ) {

      return res
        .status(400)
        .json({

          success: false,

          message:
            "Your cart is empty."

        });

    }


    /* =========================
       PRODUCT WEIGHTS
    ========================= */

    const productWeights = {

      "VANDAL JERSEY":
        0.4,

      "VANDAL TEE":
        0.4,

      "KOM TEE":
        0.4,

      "QUEEN BABY TEE":
        0.4,

      "DOUBLE WAIST":
        0.8,

      "VANDAL shorts V1":
        0.8,

      "VANDAL shorts V2":
        0.8,

      "MISCHIEF SWEATS":
        0.8,

      "FEM FOLDOVER SWEATS":
        0.8,

      "FEM SHORTS":
        0.2,

      "BEANIE":
        0.2

    };


    /* =========================
       PACKAGE ITEMS
    ========================= */

    const packageItems =
      cart.map(
        function(item) {

          const weight =
            productWeights[
              item.name
            ];


          if (!weight) {

            throw new Error(
              `Shipping weight has not been set for ${item.name}.`
            );

          }


          const quantity =
            Number(
              item.quantity ||
              item.qty ||
              1
            );


          const price =
            Number(
              item.price ||
              0
            );


          if (
            !Number.isFinite(
              price
            ) ||
            price <= 0
          ) {

            throw new Error(
              `Invalid price for ${item.name}.`
            );

          }


          return {

            name:
              item.name,

            description:
              `VANDAL ${item.name}`,

            unit_weight:
              String(
                weight
              ),

            unit_amount:
              String(
                price
              ),

            quantity:
              String(
                quantity
              )

          };

        }
      );


    /* =========================
       CUSTOMER ADDRESS
    ========================= */

    const receiverResponse =
      await fetch(

        "https://api.shipbubble.com/v1/shipping/address/validate",

        {

          method:
            "POST",

          headers,

          body:
            JSON.stringify({

              name,

              email,

              phone,

              address

            })

        }

      );


    const receiverData =
      await readShipbubble(
        receiverResponse,
        "address validation"
      );


    if (
      !receiverResponse.ok ||
      receiverData.status !==
        "success" ||
      !receiverData.data
        ?.address_code
    ) {

      return res
        .status(422)
        .json({

          success: false,

          message:
            receiverData.message ||
            "Shipbubble could not validate the delivery address."

        });

    }


    const receiverAddressCode =
      receiverData.data
        .address_code;


    /* =========================
       VANDAL PICKUP ADDRESS
    ========================= */

    const senderResponse =
      await fetch(

        "https://api.shipbubble.com/v1/shipping/address/validate",

        {

          method:
            "POST",

          headers,

          body:
            JSON.stringify({

              name:
                "Valntine Ashia",

              email:
                "wearsvandal@gmail.com",

              phone:
                "+2349034982665",

              address:
                "816A Rev. Emmanuel Adubifa Street, Ikeja, Lagos, Nigeria"

            })

        }

      );


    const senderData =
      await readShipbubble(
        senderResponse,
        "pickup address validation"
      );


    if (
      !senderResponse.ok ||
      senderData.status !==
        "success" ||
      !senderData.data
        ?.address_code
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "VANDAL pickup address could not be validated."

        });

    }


    const senderAddressCode =
      senderData.data
        .address_code;


    /* =========================
       PACKAGE CATEGORIES
    ========================= */

    const categoryResponse =
      await fetch(

        "https://api.shipbubble.com/v1/shipping/labels/categories",

        {

          method:
            "GET",

          headers

        }

      );


    const categoryData =
      await readShipbubble(
        categoryResponse,
        "package category"
      );


    if (
      !categoryResponse.ok ||
      categoryData.status !==
        "success" ||
      !Array.isArray(
        categoryData.data
      )
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Unable to retrieve Shipbubble package categories."

        });

    }


    const fashionCategory =
      categoryData.data.find(
        function(item) {

          const categoryName =
            String(
              item.category ||
              ""
            )
              .trim()
              .toLowerCase();


          return (

            categoryName ===
              "fashion wears"

            ||

            categoryName.includes(
              "fashion"
            )

          );

        }
      );


    if (!fashionCategory) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Shipbubble did not return a Fashion wears package category."

        });

    }


    const categoryId =
      Number(
        fashionCategory
          .category_id
      );


    if (
      !Number.isFinite(
        categoryId
      )
    ) {

      return res
        .status(500)
        .json({

          success: false,

          message:
            "Shipbubble returned an invalid Fashion wears category ID."

        });

    }


    /* =========================
       PICKUP DATE

       This date is only being
       used to get an estimated
       shipping quote at checkout.

       We are NOT booking the
       shipment here because
       VANDAL is made to order.
    ========================= */

    const pickupDate =
      new Date();


    pickupDate.setDate(
      pickupDate.getDate() + 1
    );


    const pickupDateString =
      pickupDate
        .toISOString()
        .split("T")[0];


    /* =========================
       FETCH RATES
    ========================= */

    const rateResponse =
      await fetch(

        "https://api.shipbubble.com/v1/shipping/fetch_rates",

        {

          method:
            "POST",

          headers,

          body:
            JSON.stringify({

              sender_address_code:
                senderAddressCode,

              reciever_address_code:
                receiverAddressCode,

              pickup_date:
                pickupDateString,

              category_id:
                categoryId,

              package_items:
                packageItems,

              package_dimension: {

                length:
                  40,

                width:
                  12,

                height:
                  5

              }

            })

        }

      );


    const rateData =
      await readShipbubble(
        rateResponse,
        "shipping rate"
      );


    if (
      !rateResponse.ok ||
      rateData.status !==
        "success"
    ) {

      return res
        .status(
          rateResponse.status ||
          400
        )
        .json({

          success: false,

          message:
            rateData.message ||
            "Shipbubble could not calculate shipping rates."

        });

    }


    /* =========================
       RETURN RATES
    ========================= */

    return res
      .status(200)
      .json({

        success:
          true,

        validated_address: {

          address_code:
            receiverAddressCode,

          formatted_address:
            receiverData.data
              .formatted_address,

          country:
            receiverData.data
              .country,

          state:
            receiverData.data
              .state,

          city:
            receiverData.data
              .city

        },

        category_used: {

          category:
            fashionCategory
              .category,

          category_id:
            categoryId

        },

        request_token:
          rateData.data
            ?.request_token ||
          null,

        couriers:
          rateData.data
            ?.couriers ||
          [],

        cheapest_courier:
          rateData.data
            ?.cheapest_courier ||
          null,

        fastest_courier:
          rateData.data
            ?.fastest_courier ||
          null

      });


  } catch (error) {

    console.error(
      "VANDAL shipping error:",
      error
    );


    return res
      .status(500)
      .json({

        success: false,

        message:
          error.message ||
          "Unable to calculate shipping."

      });

  }

}
