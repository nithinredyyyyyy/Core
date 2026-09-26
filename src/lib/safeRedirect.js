// Guards against open-redirect (CWE-601) when a redirect target comes from a
// URL query param, search result, or any other untrusted source. Browsers
// treat a leading backslash as a forward slash, so "/\evil.com" resolves to a
// different origin even though it passes a naive "starts with /" check.
export function safeInternalPath(rawPath, fallback = "/") {
  const value = String(rawPath ?? "").trim();
  if (!value) return fallback;
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("\\")) return fallback;

  try {
    const base = "https://internal.invalid";
    const resolved = new URL(value, base);
    if (resolved.origin !== base) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
