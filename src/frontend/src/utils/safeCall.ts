/**
 * Global error handler for backend calls.
 * Logs and categorizes errors: anonymous calls, reject code 5, registration errors.
 */
export function safeCall<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>,
): Promise<T> {
  return fn().catch((error: unknown) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const timestamp = new Date().toISOString();

    console.error(`[safeCall:${operation}] Error caught:`, {
      operation,
      error: errorMsg,
      context,
      timestamp,
    });

    // Categorize errors
    if (errorMsg.includes("Anonymous") || errorMsg.includes("anonymous")) {
      console.error(`[safeCall:${operation}] ❌ ANONYMOUS CALL DETECTED`);
      throw new Error(
        `${operation}: Please log in with Internet Identity to perform this action.`,
      );
    }

    // REJECT CODE 5 — canister trap. Common causes:
    //   - backend method doesn't exist (old deployed WASM)
    //   - userRoles map bug in access-control.mo
    //   - calling with anonymous identity before initializeAccessControl
    if (
      errorMsg.includes("reject code 5") ||
      errorMsg.includes("code: 5") ||
      errorMsg.includes("Canister Error") ||
      errorMsg.includes("REJECT_CODE_5")
    ) {
      console.error(
        `[safeCall:${operation}] ❌ REJECT CODE 5 (Canister Error)`,
      );
      throw new Error(
        `${operation}: Backend canister error. Please try again or contact support.`,
      );
    }

    if (
      errorMsg.includes("not registered") ||
      errorMsg.includes("registration")
    ) {
      console.error(`[safeCall:${operation}] ❌ REGISTRATION ERROR`);
      throw new Error(
        `${operation}: User registration required. Please complete your profile setup.`,
      );
    }

    if (
      errorMsg.includes("Unauthorized") ||
      errorMsg.includes("unauthorized")
    ) {
      console.error(`[safeCall:${operation}] ❌ AUTHORIZATION ERROR`);
      throw new Error(`${operation}: Access denied. ${errorMsg}`);
    }

    // Re-throw with operation context
    throw new Error(`${operation}: ${errorMsg}`);
  });
}
