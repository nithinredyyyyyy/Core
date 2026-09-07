import React from "react";

export default function PosterLogo({ src, alt, className = "", size = 48 }) {
  if (!src) {
    return (
      <div className="poster-no-logo" style={{ width: size, height: size }}>
        {alt?.slice(0, 2)?.toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        borderRadius: Math.max(2, size * 0.15),
        flexShrink: 0,
      }}
    />
  );
}
