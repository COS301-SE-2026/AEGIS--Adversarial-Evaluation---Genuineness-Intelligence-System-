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