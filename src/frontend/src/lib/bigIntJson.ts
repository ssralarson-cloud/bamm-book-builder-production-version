/**
 * Safe JSON serialization utilities for handling BigInt values
 * This module provides functions to safely stringify objects containing BigInt values
 */

/**
 * Safe JSON stringify that handles BigInt values by converting them to strings
 * This prevents "TypeError: Do not know how to serialize a BigInt" errors
 *
 * @param value - The value to stringify
 * @param space - Optional spacing for pretty-printing
 * @returns JSON string with BigInt values converted to strings
 */
export function safeStringify(value: any, space?: number): string {
  return JSON.stringify(
    value,
    (key, val) => {
      // Convert BigInt to string with a marker
      if (typeof val === "bigint") {
        const num = Number(val);
        if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
          console.warn(
            `[safeStringify] BigInt value ${val} exceeds safe integer range, converting to string`,
            { key, value: val.toString() },
          );
          return val.toString();
        }
        return num;
      }
      return val;
    },
    space,
  );
}

/**
 * Detect if an object contains any BigInt values
 * Useful for debugging and validation
 *
 * @param obj - The object to check
 * @param path - Current path in the object tree (for debugging)
 * @returns Array of paths where BigInt values were found
 */
export function detectBigInt(obj: any, path = "root"): string[] {
  const found: string[] = [];

  if (obj === null || obj === undefined) {
    return found;
  }

  if (typeof obj === "bigint") {
    found.push(`${path}: BigInt(${obj.toString()})`);
    return found;
  }

  if (Array.isArray(obj)) {
    for (let index = 0; index < obj.length; index++) {
      found.push(...detectBigInt(obj[index], `${path}[${index}]`));
    }
    return found;
  }

  if (typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      found.push(...detectBigInt(obj[key], `${path}.${key}`));
    }
  }

  return found;
}

/**
 * Check if a value contains any BigInt
 * Returns true if any BigInt is found
 */
export function hasBigInt(obj: any): boolean {
  return detectBigInt(obj).length > 0;
}
