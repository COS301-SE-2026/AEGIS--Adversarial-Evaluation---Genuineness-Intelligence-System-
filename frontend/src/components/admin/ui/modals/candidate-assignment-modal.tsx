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


  return (
    <div>Modal content</div>
  );
}