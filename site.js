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