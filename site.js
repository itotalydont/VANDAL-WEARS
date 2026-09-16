// Shared site utilities for VANDAL
// Include this file on every page BEFORE the page's own <script> block:
// <script src="site.js"></script>

function showToast(message, type) {

  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast" + (type ? " toast-" + type : "");
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

// Toggles the mobile nav menu open/closed. Expects a <nav> containing
// an element with id="navLinks" and a button calling toggleMenu().
function toggleMenu() {
  const links = document.getElementById("navLinks");
  if (links) {
    links.classList.toggle("nav-open");
  }
}

// ---- Free stickers add-on ----
// First 3 sticker units a customer picks are free (regardless of
// design/color); every unit after that costs STICKER_PRICE. Each
// sticker design can be added more than once, and "V-R Logo" / "Z"
// can have their red AND white versions both selected at once —
// each color counts as its own separate pickable variant.
const STICKER_OPTIONS = [
  { name: "V-R Logo", colors: ["red", "white"], images: { red: "sticker-vr-logo-red.png", white: "sticker-vr-logo-white.png" } },
  { name: "MS", colors: ["red", "white"], images: { red: "sticker-ms-red.png", white: "sticker-ms-white.png" } },
  { name: "vb", image: "sticker-vb.png" },
  { name: "vbs", image: "sticker-vbs.png" },
  { name: "vg1", image: "sticker-vg1.png" },
  { name: "vg2", image: "sticker-vg2.png" },
  { name: "vg3", image: "sticker-vg3.png" }
];

const FREE_STICKER_LIMIT = 3;
const STICKER_PRICE = 150;

// Flattens STICKER_OPTIONS into individually-pickable variants — a
// colorless sticker is one variant, a two-color sticker becomes two
// (e.g. "V-R Logo|red" and "V-R Logo|white"), each with its own count.
function getStickerVariants() {
  const variants = [];
  STICKER_OPTIONS.forEach(function (opt) {
    if (opt.colors) {
      opt.colors.forEach(function (color) {
        variants.push({
          key: opt.name + "|" + color,
          name: opt.name,
          color: color,
          label: opt.name + " (" + color.charAt(0).toUpperCase() + color.slice(1) + ")",
          image: opt.images[color]
        });
      });
    } else {
      variants.push({
        key: opt.name,
        name: opt.name,
        color: null,
        label: opt.name,
        image: opt.image
      });
    }
  });
  return variants;
}

// Selections are stored as { variantKey: quantity }.
function getStickerSelections() {
  try {
    const parsed = JSON.parse(localStorage.getItem("vandalStickers"));
    // Guard against leftover data from an earlier version of this
    // feature that stored a plain array instead of a {key: qty} map.
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    return {};
  }
}

function saveStickerSelections(selections) {
  localStorage.setItem("vandalStickers", JSON.stringify(selections));
}

function getTotalStickerCount(selections) {
  return Object.values(selections).reduce(function (sum, qty) { return sum + qty; }, 0);
}

// Cost only depends on total unit count, not which designs/colors.
function getStickerCost(selections) {
  const total = getTotalStickerCount(selections);
  return Math.max(0, total - FREE_STICKER_LIMIT) * STICKER_PRICE;
}