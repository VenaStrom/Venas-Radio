
export function isObj(value: unknown): value is object {
  if (
    value === null
    || value === undefined
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    console.warn("Value is not an object:", value);
    return false;
  }

  return true;
}