/* Minimal preload — desktop app keeps full web sandbox isolation.
 * Exposes nothing to the page by default; extend here if needed. */
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.platform = process.platform;
});
