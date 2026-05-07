import React, { useEffect, useMemo, useState } from "react";

function findVisibleLogoTarget() {
  if (typeof document === "undefined") return null;

  const candidates = Array.from(document.querySelectorAll("[data-core-logo-target='primary']"));
  const visibleTarget = candidates.find((node) => {
    const rect = node.getBoundingClientRect();
    const styles = window.getComputedStyle(node);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      styles.display !== "none" &&
      styles.visibility !== "hidden" &&
      styles.opacity !== "0"
    );
  });

  if (!visibleTarget) return null;

  const visualNode = visibleTarget.querySelector("img, svg") || visibleTarget;
  const rect = visualNode.getBoundingClientRect();
  return {
    width: rect.width,
    height: rect.height,
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
  };
}

export default function LoadingSpinner({ isExiting = false }) {
  const [targetRect, setTargetRect] = useState(null);

  const initialSize = useMemo(() => {
    if (typeof window === "undefined") return 224;
    return window.innerWidth >= 768 ? 256 : 208;
  }, []);

  useEffect(() => {
    if (!isExiting) {
      setTargetRect(null);
      return undefined;
    }

    const syncTarget = () => {
      setTargetRect(findVisibleLogoTarget());
    };

    const firstFrame = window.requestAnimationFrame(() => {
      syncTarget();
      window.requestAnimationFrame(syncTarget);
    });
    window.addEventListener("resize", syncTarget);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.removeEventListener("resize", syncTarget);
    };
  }, [isExiting]);

  const logoShellStyle = isExiting && targetRect
    ? {
        left: `${targetRect.centerX}px`,
        top: `${targetRect.centerY}px`,
        width: `${targetRect.width}px`,
        height: `${targetRect.height}px`,
      }
    : {
        left: "50%",
        top: "42%",
        width: `${initialSize}px`,
        height: `${initialSize}px`,
      };

  return (
    <div className="fixed inset-0 z-[999] overflow-hidden bg-[#050505] text-white">
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          isExiting ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(34,211,238,0.12),transparent_16%),radial-gradient(circle_at_50%_52%,rgba(217,70,239,0.12),transparent_22%),linear-gradient(180deg,rgba(5,5,5,1),rgba(6,8,18,0.98)_56%,rgba(5,5,5,1)_100%)]" />
      </div>

      <div
        className={`fixed -translate-x-1/2 -translate-y-1/2 transition-[left,top,width,height] duration-700 ${
          isExiting ? "z-20" : "z-10"
        }`}
        style={{
          ...logoShellStyle,
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div className={`relative h-full w-full transition-opacity duration-500 ${isExiting ? "opacity-100" : "opacity-100"}`}>
          <div className={`absolute inset-[10%] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.28)_0%,rgba(217,70,239,0.18)_42%,rgba(0,0,0,0)_74%)] blur-3xl preloader-pulse-core transition-opacity duration-500 ${isExiting ? "opacity-0" : "opacity-100"}`} />
          <div className={`absolute inset-[2%] rounded-full border border-white/8 preloader-progress-ring transition-opacity duration-500 ${isExiting ? "opacity-0" : "opacity-100"}`} />
          <img
            src="/images/core-logo.png"
            alt="Core loading"
            className={`relative z-10 h-full w-full object-contain ${
              isExiting ? "preloader-exit-settle" : "preloader-vortex-spin"
            } preloader-motion-blur`}
          />
          <div className={`pointer-events-none absolute inset-[31%] rounded-full bg-white/5 preloader-core-flicker transition-opacity duration-500 ${isExiting ? "opacity-0" : "opacity-100"}`} />
        </div>
      </div>

      <div
        className={`absolute left-1/2 top-[64%] z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-2 md:top-[63%] md:gap-3 transition-all duration-500 ${
          isExiting ? "translate-y-3 opacity-0" : "opacity-100"
        }`}
      >
        {["C", "O", "R", "E"].map((letter, index) => (
          <span
            key={letter}
            className="preloader-letter-reveal text-3xl font-black uppercase tracking-[0.32em] text-white md:text-5xl"
            style={{ animationDelay: `${0.75 + index * 0.2}s` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
