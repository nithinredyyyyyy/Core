import React from "react";

export default function LogoBlock({
  src,
  alt,
  sizeClass = "h-10 w-10",
  roundedClass = "rounded-xl",
  paddingClass = "p-2",
  className = "",
  imgClassName = "",
  children = null,
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200/90 bg-[linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(241,245,249,0.94))] shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${sizeClass} ${roundedClass} ${paddingClass} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-contain ${imgClassName}`}
          style={{ filter: "drop-shadow(0 1px 1px rgba(11,31,61,0.12))" }}
        />
      ) : (
        children
      )}
    </div>
  );
}
