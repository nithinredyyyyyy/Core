/* Remove API responses cached by earlier service worker releases. */
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("api-cache"));
});
