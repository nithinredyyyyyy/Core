import * as React from "react";

function detectStandaloneMode() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches ||
    window.navigator?.standalone,
  );
}

export function useInstallPrompt() {
  const [state, dispatch] = React.useReducer((current, action) => {
    switch (action.type) {
      case "set-install-event":
        return { ...current, installEvent: action.event };
      case "mark-installed":
        return { ...current, installEvent: null, isInstalled: true };
      case "sync-installed":
        return { ...current, isInstalled: action.value };
      case "clear-install-event":
        return { ...current, installEvent: null };
      default:
        return current;
    }
  }, {
    installEvent: null,
    isInstalled: detectStandaloneMode(),
  });

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      dispatch({ type: "set-install-event", event });
    };

    const handleInstalled = () => {
      dispatch({ type: "mark-installed" });
    };

    const mediaQuery = window.matchMedia?.("(display-mode: standalone)");
    const handleModeChange = () => {
      dispatch({ type: "sync-installed", value: detectStandaloneMode() });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    mediaQuery?.addEventListener?.("change", handleModeChange);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleInstalled);
      mediaQuery?.removeEventListener?.("change", handleModeChange);
    };
  }, []);

  const promptInstall = React.useCallback(async () => {
    if (!state.installEvent) return false;

    await state.installEvent.prompt();
    const choice = await state.installEvent.userChoice;
    if (choice?.outcome === "accepted") {
      dispatch({ type: "clear-install-event" });
      return true;
    }

    return false;
  }, [state.installEvent]);

  return {
    isInstallable: Boolean(state.installEvent) && !state.isInstalled,
    isInstalled: state.isInstalled,
    promptInstall,
  };
}
