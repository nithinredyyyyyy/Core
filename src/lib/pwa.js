export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const safeImportMetaEnv =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : {};
  const isProd = Boolean(safeImportMetaEnv.PROD);

  if (!isProd) {
    // Remove any old local registrations so dev QA always uses fresh assets.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
