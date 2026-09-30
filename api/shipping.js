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
    process.env.SHIPBUBBLE_API_KEY;


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

    Authorization:
      `Bearer ${API_KEY}`

  };


  try {


    const {

      name,
      email,
      phone,
      address,
      cart

    } =
      req.body || {};


    // =============================
    // 1. CUSTOMER INFORMATION
    // =============================

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


    // =============================
    // 2. NORMAL PRODUCT WEIGHTS
    // =============================

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
        0.2,


      // =========================
      // STICKER PACK
      // =========================
      //
      // ALWAYS 0.1 KG PER PACK.
      //
      // It does NOT matter whether
      // the pack contains:
      //
      // 6
      // 9
      // 12
      // 15
      // 18
      // or 21 stickers.
      //
      // One pack = 0.1kg.
      // Two packs = 0.2kg.
      //

      "VANDAL STICKER PACK":
        0.1

    };


    // =============================
    // 3. BUILD PACKAGE ITEMS
    // =============================

    const packageItems =
      cart.map(
        function(item) {


          let weight;


          // =========================
          // STICKER PACK
          // =========================

          if (
            item.isStickerPack ||
            item.name ===
              "VANDAL STICKER PACK"
          ) {

            weight =
              0.1;

          } else {

            weight =
              productWeights[
                item.name
              ];

          }


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
              quantity
            ) ||
            quantity <= 0
          ) {

            throw new Error(

              `Invalid quantity for ${item.name}.`

            );

          }


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


          let description =
            `VANDAL ${item.name}`;


          // Add pack information for
          // easier shipping/order debugging.

          if (
            item.isStickerPack
          ) {

            description =

              `VANDAL Sticker Pack - ` +

              `${item.packSize || ""} stickers - ` +

              `${item.packMode === "pick"
                ? "Pick My Stickers"
                : "Randomised"}`;

          }


          return {

            name:
              item.name,

            description:
              description,

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


    // =============================
    // 4. VALIDATE CUSTOMER ADDRESS
    // =============================

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
      await receiverResponse.json();


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

            "Shipbubble could not validate the delivery address.",

          shipbubble:
            receiverData

        });

    }


    const receiverAddressCode =
      receiverData
        .data
        .address_code;


    // =============================
    // 5. VALIDATE VANDAL ADDRESS
    // =============================

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
      await senderResponse.json();


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
            "VANDAL pickup address could not be validated.",

          shipbubble:
            senderData

        });

    }


    const senderAddressCode =
      senderData
        .data
        .address_code;


    // =============================
    // 6. GET SHIPBUBBLE CATEGORIES
    // =============================

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
      await categoryResponse.json();


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
            "Unable to retrieve Shipbubble package categories.",

          shipbubble:
            categoryData

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
              "fashion wears" ||

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
            "Shipbubble did not return a Fashion wears package category.",

          available_categories:
            categoryData.data

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


    // =============================
    // 7. PICKUP DATE
    // =============================

    const pickupDate =
      new Date();


    pickupDate.setDate(

      pickupDate.getDate() +
      1

    );


    const pickupDateString =

      pickupDate
        .toISOString()
        .split("T")[0];


    // =============================
    // 8. FETCH SHIPPING RATES
    // =============================

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


              // Shipbubble uses the
              // "reciever" spelling.

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
      await rateResponse.json();


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

          success:
            false,

          message:

            rateData.message ||

            "Shipbubble could not calculate shipping rates.",

          shipbubble:
            rateData,

          category_used: {

            category:
              fashionCategory
                .category,

            category_id:
              categoryId

          }

        });

    }


    // =============================
    // 9. RETURN RATES
    // =============================

    return res
      .status(200)
      .json({

        success:
          true,


        validated_address: {

          address_code:
            receiverAddressCode,

          formatted_address:
            receiverData
              .data
              .formatted_address,

          country:
            receiverData
              .data
              .country,

          state:
            receiverData
              .data
              .state,

          city:
            receiverData
              .data
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
          rateData
            .data
            .request_token,


        couriers:
          rateData
            .data
            .couriers ||
          [],


        cheapest_courier:
          rateData
            .data
            .cheapest_courier ||
          null,


        fastest_courier:
          rateData
            .data
            .fastest_courier ||
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

        success:
          false,

        message:
          "Unable to calculate shipping.",

        error:
          error.message

      });

  }

}
