import { useEffect, useReducer, useRef } from "react";

export function useMinimumLoader(
  isLoading,
  minDuration = 1800,
  exitDuration = 700,
) {
  const [, forceRender] = useReducer((count) => count + 1, 0);
  const previousLoadingRef = useRef(isLoading);
  const loadStartRef = useRef(isLoading ? Date.now() : null);
  const exitStartRef = useRef(null);
  const exitEndRef = useRef(null);

  if (previousLoadingRef.current !== isLoading) {
    const now = Date.now();
    previousLoadingRef.current = isLoading;

    if (isLoading) {
      loadStartRef.current = now;
      exitStartRef.current = null;
      exitEndRef.current = null;
    } else if (loadStartRef.current) {
      const holdUntil = loadStartRef.current + minDuration;
      exitStartRef.current = holdUntil;
      exitEndRef.current = holdUntil + exitDuration;
    } else {
      exitStartRef.current = null;
      exitEndRef.current = null;
    }
  }

  useEffect(() => {
    const timeoutIds = [];

    if (!isLoading) {
      const now = Date.now();
      const exitStartAt = exitStartRef.current;
      const exitEndAt = exitEndRef.current;

      if (exitStartAt && exitStartAt > now) {
        timeoutIds.push(
          window.setTimeout(() => {
            forceRender();
          }, exitStartAt - now),
        );
      }

      if (exitEndAt && exitEndAt > now) {
        timeoutIds.push(
          window.setTimeout(() => {
            loadStartRef.current = null;
            exitStartRef.current = null;
            exitEndRef.current = null;
            forceRender();
          }, exitEndAt - now),
        );
      }
    }

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [isLoading, minDuration, exitDuration]);

  const now = Date.now();
  const exitStartAt = exitStartRef.current;
  const exitEndAt = exitEndRef.current;

  if (isLoading) {
    return { showLoader: true, isExiting: false };
  }

  if (!loadStartRef.current) {
    return { showLoader: false, isExiting: false };
  }

  if (!exitStartAt || now < exitStartAt) {
    return { showLoader: true, isExiting: false };
  }

  if (!exitEndAt || now < exitEndAt) {
    return { showLoader: true, isExiting: true };
  }

  loadStartRef.current = null;
  exitStartRef.current = null;
  exitEndRef.current = null;
  return { showLoader: false, isExiting: false };
}
