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
            <table className="w-full border-collapse">
        <thead>
          <tr className="bg-secondary-surface border-b border-tertiary-surface">
            {["Name", "Email", "Role", "Status", "Joined", "Actions"].map((h) => (
              <th
                key={h}
                className="text-left font-jetbrains text-[9px] tracking-[0.08em] uppercase text-white-smoke/40 px-4 py-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isPending = pendingIds.has(u.user_id);
            return (
              <tr
                key={u.user_id}
                className="border-b border-tertiary-surface last:border-b-0 hover:bg-tertiary-surface/40 transition-colors duration-150"
              >
                <td className="px-4 py-3 font-jetbrains text-[11px] text-default-text">
                  {u.full_name}
                </td>
                <td className="px-4 py-3 font-jetbrains text-[11px] text-white-smoke/60">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <RoleSelect
                    user={u}
                    disabled={isPending}
                    onChange={(role) => onRoleChange(u, role)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusToggle
                      active={u.status === "active"}
                      disabled={isPending}
                      onClick={() => onToggleStatus(u)}
                    />
                    <span className="font-jetbrains text-[9px] uppercase tracking-wider text-white-smoke/40">
                      {u.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-jetbrains text-[10px] text-white-smoke/40">
                  {u.created_at ? u.created_at.split("T")[0] : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      title="Edit user"
                      disabled={isPending}
                      onClick={() => onEdit(u)}
                      className="bg-transparent border border-tertiary-surface text-white-smoke/40 p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center hover:border-system-red hover:text-system-red disabled:opacity-40"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      title="Delete user"
                      disabled={isPending}
                      onClick={() => onDelete(u)}
                      className="bg-transparent border border-system-red/30 text-system-red/70 p-1 px-2 rounded-[5px] cursor-pointer transition-all duration-150 flex items-center hover:border-system-red hover:text-system-red disabled:opacity-40"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}