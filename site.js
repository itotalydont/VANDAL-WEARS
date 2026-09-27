// =========================
// VANDAL SHARED SITE.JS
// =========================


// =========================
// TOAST NOTIFICATIONS
// =========================

function showToast(message, type) {

    let container = document.getElementById("toast-container");

    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");

    toast.className =
        "toast" + (type ? " toast-" + type : "");

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(function () {
        toast.classList.add("toast-visible");
    });

    setTimeout(function () {

        toast.classList.remove("toast-visible");

        setTimeout(function () {
            toast.remove();
        }, 300);

    }, 2600);
}


// =========================
// MOBILE MENU
// =========================

function toggleMenu() {

    const links =
        document.getElementById("navLinks");

    if (links) {
        links.classList.toggle("nav-open");
    }
}


// =========================
// STICKERS
// =========================

const STICKER_OPTIONS = [

    {
        name: "V-R Logo",
        colors: ["red", "white"],
        images: {
            red: "sticker-vr-logo-red.png",
            white: "sticker-vr-logo-white.png"
        }
    },

    {
        name: "MS",
        colors: ["red", "white"],
        images: {
            red: "sticker-ms-red.png",
            white: "sticker-ms-white.png"
        }
    },

    {
        name: "vb",
        image: "sticker-vb.png"
    },

    {
        name: "vbs",
        image: "sticker-vbs.png"
    },

    {
        name: "vg1",
        image: "sticker-vg1.png"
    },

    {
        name: "vg2",
        image: "sticker-vg2.png"
    },

    {
        name: "vg3",
        image: "sticker-vg3.png"
    }

];


// =========================
// STICKER PRICING
// =========================

// FIRST 3 STICKERS FREE
const FREE_STICKER_LIMIT = 3;

// EACH EXTRA STICKER = ₦200
const STICKER_PRICE = 200;


// =========================
// STICKER VARIANTS
// =========================

function getStickerVariants() {

    const variants = [];

    STICKER_OPTIONS.forEach(function (opt) {

        if (opt.colors) {

            opt.colors.forEach(function (color) {

                variants.push({

                    key:
                        opt.name + "|" + color,

                    name:
                        opt.name,

                    color:
                        color,

                    label:
                        opt.name +
                        " (" +
                        color.charAt(0).toUpperCase() +
                        color.slice(1) +
                        ")",

                    image:
                        opt.images[color]

                });

            });

        } else {

            variants.push({

                key:
                    opt.name,

                name:
                    opt.name,

                color:
                    null,

                label:
                    opt.name,

                image:
                    opt.image

            });

        }

    });

    return variants;
}


// =========================
// GET STICKER SELECTIONS
// =========================

function getStickerSelections() {

    try {

        const parsed =
            JSON.parse(
                localStorage.getItem(
                    "vandalStickers"
                )
            );

        if (
            parsed &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {

            return parsed;

        }

        return {};

    } catch (err) {

        return {};

    }

}


// =========================
// SAVE STICKERS
// =========================

function saveStickerSelections(selections) {

    localStorage.setItem(
        "vandalStickers",
        JSON.stringify(selections)
    );

}


// =========================
// TOTAL STICKER COUNT
// =========================

function getTotalStickerCount(selections) {

    return Object
        .values(selections)
        .reduce(function (sum, qty) {

            return sum + Number(qty || 0);

        }, 0);

}


// =========================
// STICKER COST IN NAIRA
// =========================

function getStickerCost(selections) {

    const total =
        getTotalStickerCount(selections);

    return Math.max(
        0,
        total - FREE_STICKER_LIMIT
    ) * STICKER_PRICE;

}


// =========================
// CURRENCIES
// =========================

const VANDAL_CURRENCIES = [
    "NGN",
    "USD",
    "GBP",
    "EUR",
    "CAD",
    "GHS"
];


// =========================
// EXCHANGE RATES
// =========================
//
// These rates convert ₦1
// into the selected currency.
//

const VANDAL_FX_RATES = {

    NGN: 1,

    USD: 0.000754034,

    GBP: 0.000570704,

    EUR: 0.000662515,

    CAD: 0.00106688,

    GHS: 0.00876033

};


// =========================
// CURRENCY SYMBOLS
// =========================

const VANDAL_CURRENCY_SYMBOLS = {

    NGN: "₦",

    USD: "$",

    GBP: "£",

    EUR: "€",

    CAD: "C$",

    GHS: "GH₵"

};


// =========================
// GET CURRENT CURRENCY
// =========================

function getVandalCurrency() {

    const currency =
        localStorage.getItem(
            "vandalCurrency"
        );

    if (
        VANDAL_CURRENCIES.includes(currency)
    ) {

        return currency;

    }

    return "NGN";

}


// =========================
// PRODUCT CONVERSION
// =========================
//
// EXAMPLE:
//
// If ₦25,000 converts to $18.85
// + 5% = $19.79
// website displays $20.00
//
// It DOES NOT become $100.
//
// NGN itself is never changed.
//

function convertFromNaira(amount, currency) {

    currency =
        currency ||
        getVandalCurrency();


    const ngnAmount =
        Number(amount) || 0;


    // KEEP NAIRA PRICE EXACTLY
    // AS LISTED ON WEBSITE

    if (currency === "NGN") {

        return ngnAmount;

    }


    const rate =
        VANDAL_FX_RATES[currency] || 1;


    // CONVERT FROM NAIRA

    let converted =
        ngnAmount * rate;


    // =========================
    // FOREIGN CURRENCY MARKUP
    // =========================
    //
    // Foreign currencies are
    // 5% more expensive.

    converted *= 1.05;


    // =========================
    // ROUND UP
    // =========================
    //
    // $18.01 -> $19
    // $18.99 -> $19
    // $19.00 -> $19
    //
    // NOT $100.

    converted =
        Math.ceil(converted);


    return converted;

}


// =========================
// FORMAT NORMAL PRODUCT PRICE
// =========================

function formatVandalPrice(amount, currency) {

    currency =
        currency ||
        getVandalCurrency();


    const converted =
        convertFromNaira(
            amount,
            currency
        );


    // NAIRA

    if (currency === "NGN") {

        return (
            "₦" +
            Math.round(converted)
                .toLocaleString("en-NG")
        );

    }


    // FOREIGN CURRENCIES
    //
    // Always display .00

    return (
        VANDAL_CURRENCY_SYMBOLS[currency] +
        converted.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


// =========================
// STICKER CONVERSION
// =========================
//
// STICKERS HAVE THEIR OWN
// SPECIAL PRICING.
//
// NGN = ₦200
//
// Every other currency = 1
//
// So:
//
// USD = $1.00
// GBP = £1.00
// EUR = €1.00
// CAD = C$1.00
// GHS = GH₵1.00
//

function convertStickerPrice(amount, currency) {

    currency =
        currency ||
        getVandalCurrency();


    if (currency === "NGN") {

        return Number(amount) || STICKER_PRICE;

    }


    return 1;

}


// =========================
// FORMAT STICKER PRICE
// =========================

function formatStickerPrice(amount, currency) {

    currency =
        currency ||
        getVandalCurrency();


    if (currency === "NGN") {

        return (
            "₦" +
            Math.round(
                Number(amount) ||
                STICKER_PRICE
            ).toLocaleString("en-NG")
        );

    }


    return (
        VANDAL_CURRENCY_SYMBOLS[currency] +
        "1.00"
    );

}


// =========================
// STICKER UNIT PRICE
// =========================

function getStickerUnitPrice(currency) {

    currency =
        currency ||
        getVandalCurrency();


    if (currency === "NGN") {

        return STICKER_PRICE;

    }


    return 1;

}


// =========================
// FORMAT STICKER TOTAL
// =========================
//
// Use this if the cart needs to
// display the total price of
// all paid stickers.
//

function formatStickerTotal(selections, currency) {

    currency =
        currency ||
        getVandalCurrency();


    const total =
        getTotalStickerCount(
            selections
        );


    const paidStickers =
        Math.max(
            0,
            total -
            FREE_STICKER_LIMIT
        );


    if (currency === "NGN") {

        const totalNaira =
            paidStickers *
            STICKER_PRICE;


        return (
            "₦" +
            totalNaira.toLocaleString(
                "en-NG"
            )
        );

    }


    const totalForeign =
        paidStickers * 1;


    return (
        VANDAL_CURRENCY_SYMBOLS[currency] +
        totalForeign.toLocaleString(
            undefined,
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


// =========================
// PAYMENT AMOUNT
// =========================

function getVandalPaymentAmount(amount) {

    const currency =
        getVandalCurrency();


    const converted =
        convertFromNaira(
            amount,
            currency
        );


    if (currency === "NGN") {

        return Math.round(
            converted
        );

    }


    return Number(
        converted.toFixed(2)
    );

}


// =========================
// CHANGE CURRENCY
// =========================

function setVandalCurrency(currency) {

    if (
        !VANDAL_CURRENCIES.includes(
            currency
        )
    ) {

        currency = "NGN";

    }


    localStorage.setItem(
        "vandalCurrency",
        currency
    );


    const current =
        document.getElementById(
            "currencyCurrent"
        );


    if (current) {

        current.textContent =
            currency;

    }


    const menu =
        document.getElementById(
            "currencyMenu"
        );


    if (menu) {

        menu.classList.remove(
            "currency-open"
        );

    }


    // Tell every page that
    // the currency changed.

    window.dispatchEvent(

        new CustomEvent(
            "vandalCurrencyChanged",
            {

                detail: {
                    currency: currency
                }

            }
        )

    );

}


// =========================
// CURRENCY MENU
// =========================

function toggleCurrencyMenu() {

    const menu =
        document.getElementById(
            "currencyMenu"
        );


    if (menu) {

        menu.classList.toggle(
            "currency-open"
        );

    }

}


// =========================
// CREATE CURRENCY SELECTOR
// =========================

function createCurrencySelector() {

    if (
        document.getElementById(
            "vandalCurrencyBar"
        )
    ) {

        return;

    }


    const bar =
        document.createElement(
            "div"
        );


    bar.id =
        "vandalCurrencyBar";


    bar.innerHTML = `

        <button
            type="button"
            class="currency-button"
            onclick="toggleCurrencyMenu()"
            aria-label="Choose currency"
        >

            <span id="currencyCurrent">
                ${getVandalCurrency()}
            </span>

            <span
                class="currency-arrow"
            ></span>

        </button>


        <div
            class="currency-menu"
            id="currencyMenu"
        >

            ${VANDAL_CURRENCIES
                .map(function (currency) {

                    return `

                        <button
                            type="button"
                            onclick="setVandalCurrency('${currency}')"
                        >
                            ${currency}
                        </button>

                    `;

                })
                .join("")}

        </div>

    `;


    document.body.appendChild(
        bar
    );


    // =========================
    // CLOSE MENU WHEN CLICKING
    // OUTSIDE THE SELECTOR
    // =========================

    document.addEventListener(
        "click",
        function (event) {

            const selector =
                document.getElementById(
                    "vandalCurrencyBar"
                );


            if (
                selector &&
                !selector.contains(
                    event.target
                )
            ) {

                const menu =
                    document.getElementById(
                        "currencyMenu"
                    );


                if (menu) {

                    menu.classList.remove(
                        "currency-open"
                    );

                }

            }

        }
    );

}


// =========================
// START CURRENCY SELECTOR
// =========================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        createCurrencySelector
    );

} else {

    createCurrencySelector();

}


// =========================
// MOBILE PAGE RESTORE SAFETY
// =========================
//
// Some mobile browsers keep a page in memory
// when the visitor goes to another page and
// then presses Back.
//
// When that happens, this makes sure temporary
// menus do not remain stuck open.
//

window.addEventListener(
    "pageshow",
    function (event) {

        // Only run this special cleanup when
        // the browser restored the page from
        // its back/forward cache.

        if (!event.persisted) {
            return;
        }


        // =========================
        // CLOSE MOBILE NAV MENU
        // =========================

        const navLinks =
            document.getElementById(
                "navLinks"
            );


        if (navLinks) {

            navLinks.classList.remove(
                "nav-open"
            );

        }


        // =========================
        // CLOSE CURRENCY MENU
        // =========================

        const currencyMenu =
            document.getElementById(
                "currencyMenu"
            );


        if (currencyMenu) {

            currencyMenu.classList.remove(
                "currency-open"
            );

        }

    }
);