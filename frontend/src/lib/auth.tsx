export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aegis_token");
}

export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("aegis_role");
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("aegis_token");
  localStorage.removeItem("aegis_role");
  window.location.href = "/login";
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