"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Search, Check, AlertCircle, Loader2, Copy } from "lucide-react";
import { apiGet, apiPost } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";

interface ApiCandidate {
  user_id: number;
  email: string;
  full_name: string | null;
}

interface InviteResponse {
  access_link: string;
}

type RowStatus = "idle" | "pending" | "success" | "error";
type StatusFilter = "all" | "unassigned" | "assigned";

interface CandidateAssignmentModalProps {
  assessmentId: number;
  assessmentTitle: string;
  onClose: () => void;
  onAssigned?: (count: number) => void;
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned", label: "Assigned" },
];

export default function CandidateAssignmentModal({
  assessmentId,
  assessmentTitle,
  onClose,
  onAssigned,
}: CandidateAssignmentModalProps) {
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [rowStatus, setRowStatus] = useState<Record<number, RowStatus>>({});
  const [rowError, setRowError] = useState<Record<number, string>>({});
  const [accessLinks, setAccessLinks] = useState<Record<number, string>>({});
  const [assigning, setAssigning] = useState(false);
  const [linksCopied, setLinksCopied] = useState(false);

    useEffect(() => {
  let isMounted = true;
  const fetchCandidates = async () => {
    setLoading(true);
    setLoadError(null);

    // Mock data used for testing
    const mockCandidates: ApiCandidate[] = [
      { user_id: 1, email: "alice.smith@example.com", full_name: "Alice Smith" },
      { user_id: 2, email: "bob.johnson@example.com", full_name: "Bob Johnson" },
      { user_id: 3, email: "carol.williams@example.com", full_name: null },
      { user_id: 4, email: "dave.brown@example.com", full_name: "Dave Brown" },
      { user_id: 5, email: "eve.davis@example.com", full_name: "Eve Davis" },
      { user_id: 6, email: "frank.miller@example.com", full_name: null },
      { user_id: 7, email: "grace.wilson@example.com", full_name: "Grace Wilson" },
      { user_id: 8, email: "hank.moore@example.com", full_name: "Hank Moore" },
      { user_id: 9, email: "ivy.taylor@example.com", full_name: "Ivy Taylor" },
      { user_id: 10, email: "jack.anderson@example.com", full_name: "Jack Anderson" },
    ];
    if (isMounted) {
      setCandidates(mockCandidates);
      setLoading(false);
    }
    return; 

    /* Original API call
    try {
      const data = await apiGet<ApiCandidate[]>("/api/v1/users/candidates", {
        headers: getAuthHeaders(),
      });
      if (isMounted) setCandidates(data);
    } catch (err) {
      if (isMounted) {
        setLoadError(err instanceof Error ? err.message : "Failed to load candidates.");
      }
    } finally {
      if (isMounted) setLoading(false);
    }
    */
  };
  fetchCandidates();
  return () => {
    isMounted = false;
  };
}, []);

useEffect(() => {
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };
  document.addEventListener("keydown", handleKey);
  return () => document.removeEventListener("keydown", handleKey);
}, [onClose]);


const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      const matchesSearch =
        !q ||
        c.email.toLowerCase().includes(q) ||
        (c.full_name ?? "").toLowerCase().includes(q);
      const isAssigned = assignedIds.has(c.user_id);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "assigned" && isAssigned) ||
        (statusFilter === "unassigned" && !isAssigned);
      return matchesSearch && matchesStatus;
    });
  }, [candidates, search, statusFilter, assignedIds]);

  const selectableVisible = filtered.filter((c) => !assignedIds.has(c.user_id));
  const allVisibleSelected =
    selectableVisible.length > 0 && selectableVisible.every((c) => selected.has(c.user_id));

  const toggleCandidate = (id: number) => {
    if (assignedIds.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        selectableVisible.forEach((c) => next.delete(c.user_id));
      } else {
        selectableVisible.forEach((c) => next.add(c.user_id));
      }
      return next;
    });
  };

    const handleBulkAssign = async () => {
    const targets = Array.from(selected).filter((id) => !assignedIds.has(id));
    if (targets.length === 0) return;

    setAssigning(true);
    setLinksCopied(false);
    setRowStatus((prev) => {
      const next = { ...prev };
      targets.forEach((id) => (next[id] = "pending"));
      return next;
    });

    const results = await Promise.allSettled(
      targets.map((id) =>
        apiPost<InviteResponse, { candidate_id: number }>(
          `/api/v1/assessments/${assessmentId}/invite`,
          { candidate_id: id },
          { headers: getAuthHeaders() }
        ).then((res) => ({ id, res }))
      )
    );

    let successCount = 0;
    const nextStatus: Record<number, RowStatus> = {};
    const nextError: Record<number, string> = {};
    const nextLinks: Record<number, string> = {};
    const nextAssigned = new Set(assignedIds);

    results.forEach((result, i) => {
      const id = targets[i];
      if (result.status === "fulfilled") {
        successCount += 1;
        nextStatus[id] = "success";
        nextLinks[id] = result.value.res.access_link;
        nextAssigned.add(id);
      } else {
        nextStatus[id] = "error";
        nextError[id] =
          result.reason instanceof Error ? result.reason.message : "Failed to assign.";
      }
    });

    setRowStatus((prev) => ({ ...prev, ...nextStatus }));
    setRowError((prev) => ({ ...prev, ...nextError }));
    setAccessLinks((prev) => ({ ...prev, ...nextLinks }));
    setAssignedIds(nextAssigned);
    setSelected((prev) => {
      const next = new Set(prev);
      Object.entries(nextStatus).forEach(([id, status]) => {
        if (status === "success") next.delete(Number(id));
      });
      return next;
    });
    setAssigning(false);
    if (successCount > 0) onAssigned?.(successCount);
  };

  const successfulLinks = Object.values(accessLinks);
  const failedCount = Object.values(rowStatus).filter((s) => s === "error").length;

  const copyAllLinks = () => {
    if (successfulLinks.length === 0) return;
    navigator.clipboard.writeText(successfulLinks.join("\n"));
    setLinksCopied(true);
    setTimeout(() => setLinksCopied(false), 1500);
  };

    return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-secondary-surface border border-tertiary-surface rounded-[5px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between px-5 py-4 border-b border-tertiary-surface">
          <div className="min-w-0">
            <div className="font-staatliches text-[20px] tracking-[0.06em] leading-none text-white-smoke">
              ASSIGN CANDIDATES
            </div>
            <div className="font-jetbrains text-[10px] text-white-smoke/40 mt-1 truncate">
              {assessmentTitle}
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-white-smoke/40 hover:text-system-red transition-colors duration-150 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-tertiary-surface flex-wrap">
          <div className="relative flex-1 min-w-50">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white-smoke/40"
              size={14}
            />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-default-border text-default-text pl-9 pr-3 py-2 font-jetbrains text-[11px] tracking-[0.04em] rounded-[5px] outline-none placeholder:text-white-smoke/40 transition-colors duration-150 hover:bg-tertiary-surface focus:border-system-red focus:bg-background"
            />
          </div>

          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                type="button"
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`font-jetbrains text-[10px] tracking-wider px-3 py-1.25 rounded-[5px] cursor-pointer border transition-all duration-150 uppercase ${
                  statusFilter === f.key
                    ? "bg-system-red/15 border-system-red text-system-red"
                    : "bg-background border-default-border text-default-text hover:bg-tertiary-surface"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {selectableVisible.length > 0 && (
          <div className="flex items-center gap-2.5 px-5 py-2 border-b border-tertiary-surface">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              className="h-3.5 w-3.5 cursor-pointer accent-system-red"
            />
            <span className="font-jetbrains text-[9px] tracking-[0.06em] uppercase text-white-smoke/40">
              Select all visible ({selectableVisible.length})
            </span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16 font-jetbrains text-[12px] text-white-smoke/40">
              Loading candidates...
            </div>
          ) : loadError ? (
            <div className="flex items-center justify-center py-16 font-jetbrains text-[12px] text-system-red">
              {loadError}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="font-staatliches text-[18px] tracking-[0.06em] text-[rgba(245,245,245,0.22)] mb-1.5">
                NO CANDIDATES FOUND
              </div>
              <div className="font-jetbrains text-[10px] text-[rgba(245,245,245,0.22)]">
                Try adjusting your search or filter.
              </div>
            </div>
          ) : (
            filtered.map((c) => {
              const isAssigned = assignedIds.has(c.user_id);
              const isSelected = selected.has(c.user_id);
              const status = rowStatus[c.user_id] ?? "idle";
              return (
                <div
                  key={c.user_id}
                  onClick={() => toggleCandidate(c.user_id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[5px] transition-colors duration-150 ${
                    isAssigned ? "opacity-50" : "cursor-pointer hover:bg-tertiary-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected || isAssigned}
                    disabled={isAssigned}
                    onChange={() => toggleCandidate(c.user_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 cursor-pointer accent-system-red disabled:cursor-default"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-staatliches text-[13px] tracking-[0.04em] text-white-smoke truncate">
                      {c.full_name ?? c.email}
                    </div>
                    <div className="font-jetbrains text-[9px] text-white-smoke/40 truncate">
                      {c.email}
                    </div>
                  </div>

                  {status === "pending" && (
                    <Loader2 size={14} className="text-white-smoke/40 animate-spin shrink-0" />
                  )}
                  {status === "success" && (
                    <span className="flex items-center gap-1 font-jetbrains text-[9px] text-status-success shrink-0">
                      <Check size={13} /> ASSIGNED
                    </span>
                  )}
                  {status === "error" && (
                    <span
                      title={rowError[c.user_id]}
                      className="flex items-center gap-1 font-jetbrains text-[9px] text-system-red shrink-0"
                    >
                      <AlertCircle size={13} /> FAILED
                    </span>
                  )}
                  {status === "idle" && isAssigned && (
                    <span className="flex items-center gap-1 font-jetbrains text-[9px] text-status-success shrink-0">
                      <Check size={13} /> ASSIGNED
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

                <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-tertiary-surface flex-wrap">
          <div className="font-jetbrains text-[10px] text-white-smoke/40">
            TARGETS SELECTED: {String(selected.size).padStart(2, "0")}
            {failedCount > 0 && (
              <span className="text-system-red ml-2">{failedCount} failed</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {successfulLinks.length > 0 && (
              <button
                type="button"
                onClick={copyAllLinks}
                className="flex items-center gap-1.5 font-jetbrains text-[10px] tracking-wider text-default-text bg-background border border-default-border px-3 py-2 rounded-[5px] cursor-pointer transition-colors duration-150 hover:bg-tertiary-surface"
              >
                <Copy size={12} />
                {linksCopied ? "COPIED" : `COPY LINKS (${successfulLinks.length})`}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="font-jetbrains text-[10px] tracking-wider text-default-text bg-background border border-default-border px-4 py-2 rounded-[5px] cursor-pointer transition-colors duration-150 hover:bg-tertiary-surface"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handleBulkAssign}
              disabled={assigning || selected.size === 0}
              className="flex items-center gap-1.5 font-staatliches tracking-wider text-[13px] bg-default-text text-background border border-transparent px-4 py-2 rounded-[5px] cursor-pointer transition-colors duration-150 hover:bg-transparent hover:text-system-red hover:border-system-red disabled:opacity-40 disabled:cursor-default disabled:hover:bg-default-text disabled:hover:text-background disabled:hover:border-transparent"
            >
              {assigning && <Loader2 size={14} className="animate-spin" />}
              ASSIGN SELECTED
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}