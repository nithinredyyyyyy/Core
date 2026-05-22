export function createFormSnapshot(value) {
  try {
    return JSON.stringify(value ?? null);
  } catch {
    return "";
  }
}

export function confirmDiscardIfDirty(
  isDirty,
  message = "Discard unsaved changes?",
) {
  if (!isDirty) return true;
  if (typeof window === "undefined" || typeof window.confirm !== "function") {
    return false;
  }
  return window.confirm(message);
}
