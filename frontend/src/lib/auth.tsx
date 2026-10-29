import { apiPost } from "@/lib/apiClient";

type LogoutRedirect = (destination: string) => void;

function redirectToLocation(destination: string): void {
  window.location.href = destination;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aegis_token");
}

export function getTokenExpiryMs(): number | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    if (!payload.exp) return null;
    return Number(payload.exp) * 1000;
  } catch {
    return null;
  }
}

export function isTokenExpired(): boolean {
  const expiry = getTokenExpiryMs();
  if (!expiry) return true;
  return Date.now() >= expiry;
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aegis_role");
}

export function isAuthenticated(): boolean {
  return getToken() !== null && !isTokenExpired();
}

export async function logout(
  redirectTo = "/auth?mode=login",
  redirect: LogoutRedirect = redirectToLocation
): Promise<void> {
  if (typeof window === "undefined") return;

  const token = getToken();
  try {
    if (token) {
      await apiPost<void>("/api/v1/auth/logout", undefined, {
        authToken: token,
        suppressUnauthorizedHandling: true,
      });
    }
  } catch (error) {
    console.error("Backend logout failed; clearing the local session.", error);
  } finally {
    localStorage.removeItem("aegis_token");
    localStorage.removeItem("aegis_role");
    redirect(redirectTo);
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

type TokenPayload = {
  user_id?: string;
};

export function getUserId(): number | null {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(
      window.atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as TokenPayload;

    const userId = Number(payload.user_id);
    return Number.isInteger(userId) ? userId : null;
  } catch {
    return null;
  }
}
