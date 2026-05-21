import * as React from "react";

function detectStandaloneMode() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator?.standalone
  );
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = React.useState(null);
  const [isInstalled, setIsInstalled] = React.useState(detectStandaloneMode);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const handleModeChange = () => {
      setIsInstalled(detectStandaloneMode());
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    mediaQuery?.addEventListener?.("change", handleModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery?.removeEventListener?.("change", handleModeChange);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!installEvent) return false;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice?.outcome === "accepted") {
      setInstallEvent(null);
      return true;
    }

    return false;
  }, [installEvent]);

  return {
    isInstallable: Boolean(installEvent) && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
