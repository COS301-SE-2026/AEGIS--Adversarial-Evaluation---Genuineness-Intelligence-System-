
export type UserRole = "RECRUITER" | "CANDIDATE";
export type UserStatus = "active" | "disabled";

export const ALL_ROLES: UserRole[] = ["RECRUITER", "CANDIDATE"];

export interface ApiUser {
  user_id: number;
  email: string;
  full_name: string | null;
  role?: string;
  status?: string;
  is_active?: boolean;
  created_at?: string | null;
}

export interface AdminUser {
  user_id: number;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string | null;
}

function normalizeRole(role?: string): UserRole {
  const upper = (role ?? "").toUpperCase();
  return (ALL_ROLES as string[]).includes(upper) ? (upper as UserRole) : "CANDIDATE";
}

function normalizeStatus(user: ApiUser): UserStatus {
  if (typeof user.is_active === "boolean") return user.is_active ? "active" : "disabled";
  if (user.status === "disabled") return "disabled";
  return "active";
}

export function normalizeUser(user: ApiUser): AdminUser {
  return {
    user_id: user.user_id,
    full_name: user.full_name?.trim() || "Unnamed User",
    email: user.email,
    role: normalizeRole(user.role),
    status: normalizeStatus(user),
    created_at: user.created_at ?? null,
  };
}