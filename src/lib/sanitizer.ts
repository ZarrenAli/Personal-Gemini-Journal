/**
 * Utility to strip undefined properties recursively from objects
 * preventing Firestore driver rejections and runtime exceptions.
 */
export function sanitizePayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  return JSON.parse(
    JSON.stringify(data, (_key, value) => {
      // Convert undefined to null or omit
      if (value === undefined) {
        return null;
      }
      return value;
    })
  );
}

/**
 * Deeply strips undefined keys by mutating/constructing pure objects without undefined keys.
 */
export function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      result[key] = stripUndefined(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
