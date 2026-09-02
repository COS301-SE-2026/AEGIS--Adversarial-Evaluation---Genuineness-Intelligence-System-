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

          {/* Filter bar */}

          {/* User table */}
        </main>
      </div>

      {/* Modals */}
    </div>
  );
}