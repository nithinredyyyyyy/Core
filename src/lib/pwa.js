export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const safeImportMetaEnv =
    typeof import.meta !== "undefined" && import.meta.env
      ? import.meta.env
      : {};
  const isProd = Boolean(safeImportMetaEnv.PROD);

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (!isProd && !isLocalhost) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
