import React from "react";
import { useTheme } from "@/lib/ThemeContext";

export default function LogoBlock({
  src = null,
  alt = "",
  sizeClass = "size-10",
  roundedClass = "rounded-md",
  paddingClass = "p-2",
  className = "",
  imgClassName = "",
  surfaceTone = "light",
  children = null,
}) {
  const { theme } = useTheme();
  const shouldUseDarkSurface = theme === "dark" && surfaceTone === "dark";

  if (shouldUseDarkSurface) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/90 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white ${sizeClass} ${roundedClass} ${paddingClass} ${className}`}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className={`size-full object-contain ${imgClassName}`}
            style={{ filter: "drop-shadow(0 1px 1px rgba(11,31,61,0.12))" }}
          />
        ) : (
          children
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/90 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white ${sizeClass} ${roundedClass} ${paddingClass} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`size-full object-contain ${imgClassName}`}
          style={{ filter: "drop-shadow(0 1px 1px rgba(11,31,61,0.12))" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
