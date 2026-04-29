export function isObj(value: unknown): value is Record<string, unknown> {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  return true;
}