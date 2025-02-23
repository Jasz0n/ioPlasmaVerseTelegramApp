// ✅ Global in-memory store for login tokens
export const tempTokens = new Map<string, number>(); // { token: expirationTime }
