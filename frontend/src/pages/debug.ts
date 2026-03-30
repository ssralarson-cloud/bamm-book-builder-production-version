/**
 * Debug utilities for diagnosing BigInt serialization issues
 */

/**
 * Check if an object contains any BigInt values
 * Returns true if BigInt is found, false otherwise
 */
export function debugHasBigInt(obj: any, label: string = 'object'): boolean {
  const leaks = findBigIntPaths(obj);
  
  if (leaks.length > 0) {
    console.log(`[Debug] ${label} contains BigInt values:`, leaks);
    return true;
  } else {
    console.log(`[Debug] ${label} has no BigInt values ✓`);
    return false;
  }
}

/**
 * Recursively find all paths containing BigInt values
 */
function findBigIntPaths(obj: any, path: string = 'root'): string[] {
  const paths: string[] = [];
  
  if (obj === null || obj === undefined) {
    return paths;
  }
  
  if (typeof obj === 'bigint') {
    paths.push(`${path} = BigInt(${obj.toString()})`);
    return paths;
  }
  
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      paths.push(...findBigIntPaths(item, `${path}[${index}]`));
    });
    return paths;
  }
  
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      paths.push(...findBigIntPaths(obj[key], `${path}.${key}`));
    });
  }
  
  return paths;
}
