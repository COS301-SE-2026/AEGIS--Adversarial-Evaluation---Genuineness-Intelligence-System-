"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import CandidateFilterBar from "@/components/admin/ui/buttons/candidate-filter-bar";
import UserTable from "@/components/admin/ui/cards/user-table";
import EditUserModal from "@/components/admin/ui/modals/edit-user-modal";
import ConfirmationModal from "@/components/ui/confirmation/confirmationModal";
import { isAuthenticated, getRole, getAuthHeaders } from "@/lib/auth";
import { apiGet, apiPatch, apiDelete } from "@/lib/apiClient";
import { ApiUser, AdminUser, UserRole, normalizeUser } from "@/app/(admin)/types/users";

export default function CandidatesPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

    const loadUsers = useCallback(async () => {
    try {
      setLoadingData(true);
      setDataError(null);
      const data = await apiGet<ApiUser[]>("/api/v1/users/candidates", {
        headers: getAuthHeaders(),
      });
      setUsers(data.map(normalizeUser));
    } catch (err) {
      setDataError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoadingData(false);
    }
  }, []);

    const roleOptions = useMemo(
    () => ["all", ...Array.from(new Set(users.map((u) => u.role)))],
    [users]
  );
  const statusOptions = useMemo(
    () => ["all", ...Array.from(new Set(users.map((u) => u.status)))],
    [users]
  );

    const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const withPending = useCallback(
    async (userId: number, action: () => Promise<void>) => {
      setPendingIds((prev) => new Set(prev).add(userId));
      try {
        await action();
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
      }
    },
    []
  );

    const handleSaveEdit = async (
    user: AdminUser,
    updates: { full_name: string; email: string }
  ) => {
    await apiPatch(`/api/v1/users/${user.user_id}`, updates, {
      headers: getAuthHeaders(),
    });
    setUsers((prev) =>
      prev.map((u) => (u.user_id === user.user_id ? { ...u, ...updates } : u))
    );
  };

  const handleRoleChange = (user: AdminUser, role: UserRole) => {
    if (role === user.role) return;
    withPending(user.user_id, async () => {
      const previous = user.role;
      setUsers((prev) =>
        prev.map((u) => (u.user_id === user.user_id ? { ...u, role } : u))
      );
      try {
        await apiPatch(
          `/api/v1/users/${user.user_id}/role`,
          { role },
          { headers: getAuthHeaders() }
        );
      } catch (err) {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === user.user_id ? { ...u, role: previous } : u
          )
        );
        setDataError(
          err instanceof Error ? err.message : "Failed to change role."
        );
      }
    });
  };

  const handleToggleStatus = (user: AdminUser) => {
    withPending(user.user_id, async () => {
      const nextStatus = user.status === "active" ? "disabled" : "active";
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === user.user_id ? { ...u, status: nextStatus } : u
        )
      );
      try {
        await apiPatch(
          `/api/v1/users/${user.user_id}/status`,
          { status: nextStatus },
          { headers: getAuthHeaders() }
        );
      } catch (err) {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === user.user_id ? { ...u, status: user.status } : u
          )
        );
        setDataError(
          err instanceof Error ? err.message : "Failed to update status."
        );
      }
    });
  };

  const handleDelete = (user: AdminUser) => {
    apiDelete(`/api/v1/users/${user.user_id}`, { headers: getAuthHeaders() })
      .then(() => {
        setUsers((prev) => prev.filter((u) => u.user_id !== user.user_id));
      })
      .catch((err) => {
        setDataError(err instanceof Error ? err.message : "Failed to delete user.");
      });
  };

  useEffect(() => {
    if (!authChecked) return;
    loadUsers();
  }, [authChecked, loadUsers]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated() || getRole() !== "RECRUITER") {
        router.replace("/login");
        return;
      }
      setAuthChecked(true);
    };
    checkAuth();
  }, [router]);

  if (!authChecked) {
    return (
      <div className="flex min-h-screen bg-background text-white-smoke items-center justify-center">
        <div className="font-jetbrains text-[12px] text-white-smoke/40">
          Checking access...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-white-smoke">
      <div className="flex flex-col flex-1 min-w-0">
        <main className="flex-1 overflow-y-auto px-7 py-6">
          <div className="flex items-start justify-between mb-5">
            <h1 className="font-staatliches text-[30px] tracking-[0.06em] leading-none text-default-text">
              CANDIDATE REGISTRY
            </h1>
          </div>

          <CandidateFilterBar
            search={search}
            onSearchChange={setSearch}
            roleFilter={roleFilter}
            onRoleChange={setRoleFilter}
            roleOptions={roleOptions}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            statusOptions={statusOptions}
          />

            {loadingData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-jetbrains text-[12px] text-white-smoke/40">
                Loading users...
              </div>
            </div>
          ) : dataError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="font-jetbrains text-[12px] text-system-red">
                {dataError}
              </div>
            </div>
          ) : (
            <UserTable
              users={filtered}
              pendingIds={pendingIds}
              onEdit={setEditingUser}
              onDelete={setDeletingUser}
              onRoleChange={handleRoleChange}
              onToggleStatus={handleToggleStatus}
            />
          )}
        </main>
      </div>

            {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveEdit}
        />
      )}

      <ConfirmationModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deletingUser && handleDelete(deletingUser)}
        headerText="Delete User"
        title={`Delete ${deletingUser?.full_name ?? "this user"}?`}
        description={`This will permanently delete ${deletingUser?.email ?? "this account"}. This action cannot be undone.`}
        confirmText="DELETE"
        isDanger
      />
    </div>
  );
}