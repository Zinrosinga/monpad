/**
 * localTokenStore.ts
 * Simple localStorage-based store for deployed token contracts.
 * Works offline and persists between browser sessions.
 */

export interface LocalTokenInfo {
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  deployer?: string;
  timestamp?: number;
}

/** Internal helper to get storage key per chain */
function getKey(chainId: number) {
  return `deployedTokens_${chainId}`;
}

/** Save a new token to localStorage */
export function saveToken(token: LocalTokenInfo) {
  try {
    const key = getKey(token.chainId);
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const alreadyExists = existing.some(
      (t: LocalTokenInfo) =>
        t.address.toLowerCase() === token.address.toLowerCase()
    );
    if (alreadyExists) return; // avoid duplicates

    const entry = {
      ...token,
      timestamp: token.timestamp || Math.floor(Date.now() / 1000),
    };
    const updated = [...existing, entry];
    localStorage.setItem(key, JSON.stringify(updated));
    console.log("✅ Token saved locally:", entry);
  } catch (err) {
    console.error("❌ Failed to save token:", err);
  }
}

/** Get all tokens for a specific chainId */
export function getTokens(chainId: number): LocalTokenInfo[] {
  try {
    const key = getKey(chainId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (err) {
    console.error("❌ Failed to load tokens:", err);
    return [];
  }
}

/** Remove one token by address */
export function removeToken(chainId: number, address: string) {
  try {
    const key = getKey(chainId);
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    const filtered = stored.filter(
      (t: LocalTokenInfo) =>
        t.address.toLowerCase() !== address.toLowerCase()
    );
    localStorage.setItem(key, JSON.stringify(filtered));
    console.log(`🗑️ Removed token ${address}`);
  } catch (err) {
    console.error("❌ Failed to remove token:", err);
  }
}

/** Clear all tokens (for all chains) */
export function clearAllTokens() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("deployedTokens_"))
      .forEach((k) => localStorage.removeItem(k));
    console.log("🧹 Cleared all local tokens");
  } catch (err) {
    console.error("❌ Failed to clear tokens:", err);
  }
}
