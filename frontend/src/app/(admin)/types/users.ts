
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