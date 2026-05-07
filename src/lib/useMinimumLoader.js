import { useEffect, useRef, useState } from "react";

export function useMinimumLoader(isLoading, minDuration = 1800, exitDuration = 700) {
  const [showLoader, setShowLoader] = useState(isLoading);
  const [isExiting, setIsExiting] = useState(false);
  const loadStartRef = useRef(null);

  useEffect(() => {
    let holdTimeoutId;
    let exitTimeoutId;

    if (isLoading) {
      if (!loadStartRef.current) {
        loadStartRef.current = Date.now();
      }
      setIsExiting(false);
      setShowLoader(true);
    } else {
      const startedAt = loadStartRef.current;
      const elapsed = startedAt ? Date.now() - startedAt : minDuration;
      const remaining = Math.max(minDuration - elapsed, 0);

      holdTimeoutId = window.setTimeout(() => {
        setIsExiting(true);

        exitTimeoutId = window.setTimeout(() => {
          setShowLoader(false);
          setIsExiting(false);
          loadStartRef.current = null;
        }, exitDuration);
      }, remaining);
    }

    return () => {
      if (holdTimeoutId) window.clearTimeout(holdTimeoutId);
      if (exitTimeoutId) window.clearTimeout(exitTimeoutId);
    };
  }, [isLoading, minDuration, exitDuration]);

  return { showLoader, isExiting };
}
