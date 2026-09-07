import React from "react";

export function AwardIcon({ type, size = 20, color = "#ffffff" }) {
  const s = size;
  switch (type) {
    case "trophy":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <path d="M12 15c-3.3 0-6-2.7-6-6V3h12v6c0 3.3-2.7 6-6 6z" fill={color} />
          <path d="M9 3H6v2c0 2.8 2.2 5 5 5" stroke={color} strokeWidth="1.5" fill="none" />
          <path d="M15 3h3v2c0 2.8-2.2 5-5 5" stroke={color} strokeWidth="1.5" fill="none" />
          <rect x="10" y="15" width="4" height="3" rx="0.5" fill={color} />
          <rect x="8" y="18" width="8" height="2" rx="1" fill={color} />
        </svg>
      );
    case "starburst":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8 5.8 21.3l2.4-7.4L2 9.4h7.6z" />
        </svg>
      );
    case "compass":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" fill={color} />
        </svg>
      );
    case "shield":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2L4 6v5c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" />
        </svg>
      );
    case "risingStar":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
          <path d="M5 2v4M2 5h4" stroke={color} strokeWidth="1.5" fill="none" />
        </svg>
      );
    case "grenade":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <circle cx="12" cy="14" r="7" />
          <rect x="10" y="3" width="4" height="5" rx="2" fill={color} />
          <line x1="14" y1="4" x2="18" y2="2" stroke={color} strokeWidth="1.5" />
        </svg>
      );
    case "medical":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <rect x="9" y="3" width="6" height="18" rx="1" />
          <rect x="3" y="9" width="18" height="6" rx="1" />
        </svg>
      );
    case "eye":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" fill={color} fillOpacity="0.15" />
          <circle cx="12" cy="12" r="3" fill={color} />
        </svg>
      );
    case "lightning":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "skull":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill={color}>
          <path d="M12 2C6.5 2 2 6.5 2 12c0 3.3 1.6 6.2 4 8v2h4v-1.5c0-.8.7-1.5 1.5-1.5h3c.8 0 1.5.7 1.5 1.5V22h4v-2c2.4-1.8 4-4.7 4-8 0-5.5-4.5-10-10-10z" />
          <circle cx="8.5" cy="11" r="2" fill="#0a0a0a" />
          <circle cx="15.5" cy="11" r="2" fill="#0a0a0a" />
          <rect x="10" y="16" width="4" height="1.5" rx="0.5" fill="#0a0a0a" />
        </svg>
      );
    default:
      return null;
  }
}
