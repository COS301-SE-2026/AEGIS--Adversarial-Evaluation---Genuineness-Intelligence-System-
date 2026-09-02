"use client";

type FilterValue = string;

interface CandidateFilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  roleFilter: FilterValue;
  onRoleChange: (r: FilterValue) => void;
  roleOptions: FilterValue[];
  statusFilter: FilterValue;
  onStatusChange: (s: FilterValue) => void;
  statusOptions: FilterValue[];
}

export default function CandidateFilterBar({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  roleOptions,
  statusFilter,
  onStatusChange,
  statusOptions,
}: CandidateFilterBarProps) {
  return (
    <div className="flex flex-col gap-2.5 mb-5">
      {/* Filters */}
    </div>
  );
}