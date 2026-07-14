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
export function isArr(value: unknown): value is unknown[] {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (!Array.isArray(value)) {
    return false;
  }
  return true;
}
export function isSet(value: unknown): value is Set<unknown> {
  if (!value) {
    return false;
  }
  if (typeof value !== "object") {
    return false;
  }
  if (!(value instanceof Set)) {
    return false;
  }
  return true;
}
