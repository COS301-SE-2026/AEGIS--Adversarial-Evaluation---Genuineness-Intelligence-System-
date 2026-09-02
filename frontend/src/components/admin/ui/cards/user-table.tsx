"use client";

import { AdminUser, ALL_ROLES, UserRole } from "@/app/(admin)/types/users";

interface UserTableProps {
  users: AdminUser[];
  pendingIds: Set<number>;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onRoleChange: (user: AdminUser, role: UserRole) => void;
  onToggleStatus: (user: AdminUser) => void;
}

function RoleSelect({
  user,
  disabled,
  onChange,
}: {
  user: AdminUser;
  disabled: boolean;
  onChange: (role: UserRole) => void;
}) {
  return (
    <select
      title="Change this user's role"
      value={user.role}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="
        bg-background border border-default-border text-default-text
        font-jetbrains text-[10px] tracking-wider uppercase rounded-[5px]
        px-2 py-1 outline-none cursor-pointer
        hover:bg-tertiary-surface focus:border-system-red
        disabled:opacity-40 disabled:cursor-not-allowed
      "
    >
      {ALL_ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}

function StatusToggle({
  active,
  disabled,
  onClick,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={active ? "Disable account" : "Enable account"}
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0
        disabled:opacity-40 disabled:cursor-not-allowed
        ${active ? "bg-status-success-dim" : "bg-tertiary-surface border border-default-border"}
      `}
    >
      <span
        className={`
          absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white-smoke
          transition-transform duration-150
          ${active ? "translate-x-4" : "translate-x-0"}
        `}
      />
    </button>
  );
}

export default function UserTable({
  users,
  pendingIds,
  onEdit,
  onDelete,
  onRoleChange,
  onToggleStatus,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="font-staatliches text-[22px] tracking-[0.06em] text-[rgba(245,245,245,0.22)] mb-2">
          NO USERS FOUND
        </div>
        <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)]">
          Try adjusting your search or filters.
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-tertiary-surface rounded-[5px]">
      {/* Table */}
    </div>
  );
}