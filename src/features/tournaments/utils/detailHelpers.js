

export function formatUsdAmount(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? `$${Math.round(number).toLocaleString("en-US")}` : "";
}
