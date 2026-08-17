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

  // trigger the fade/slide-in on the next frame
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