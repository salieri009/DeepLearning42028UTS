export const SESSION_TOKEN_HEADER = "X-Session-Token";

const STORAGE_KEY = "crowdnav.sessionTokens";

type TokenMap = Record<string, string>;

function readMap(): TokenMap {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as TokenMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: TokenMap) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function storeSessionToken(sessionId: number, accessToken: string) {
  const map = readMap();
  map[String(sessionId)] = accessToken;
  writeMap(map);
}

export function getSessionToken(sessionId: number): string | null {
  return readMap()[String(sessionId)] ?? null;
}

export function sessionAuthHeaders(sessionId: number): Record<string, string> {
  const token = getSessionToken(sessionId);
  return token ? { [SESSION_TOKEN_HEADER]: token } : {};
}
