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

  return (
    <div>Modal content</div>
  );
}