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
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-800/45 bg-[linear-gradient(180deg,_rgba(15,23,42,0.68),_rgba(2,6,23,0.76))] shadow-[0_4px_12px_rgba(15,23,42,0.10)] ${sizeClass} ${roundedClass} ${paddingClass} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full object-contain ${imgClassName}`}
        />
      ) : (
        children
      )}
    </div>
  );
}
