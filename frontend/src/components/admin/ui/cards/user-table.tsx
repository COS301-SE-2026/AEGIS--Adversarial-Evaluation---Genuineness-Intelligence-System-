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