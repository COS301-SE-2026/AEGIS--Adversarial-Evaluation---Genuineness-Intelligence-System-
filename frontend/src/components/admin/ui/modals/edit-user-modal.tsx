"use client";

import { useState } from "react";
import { AdminUser } from "@/app/(admin)/types/users";

interface EditUserModalProps {
  user: AdminUser;
  onClose: () => void;
  onSave: (user: AdminUser, updates: { full_name: string; email: string }) => Promise<void>;
}

export default function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [email, setEmail] = useState(user.email);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(user, { full_name: fullName.trim(), email: email.trim() });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4">
      <div className="w-full max-w-[420px] bg-secondary-surface border border-tertiary-surface rounded-[6px] p-6">
        <h2 className="font-staatliches text-[20px] tracking-[0.05em] text-default-text mb-4">
          EDIT USER
        </h2>
        {success ? (
          <div className="py-8 text-center">
            <div className="font-staatliches text-[18px] tracking-[0.05em] text-status-success">
              USER UPDATED
            </div>

            <p className="mt-2 font-jetbrains text-[10px] text-white-smoke/50">
              Changes saved successfully.
            </p>
          </div>
        ) : (
          <>

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-jetbrains text-[9px] uppercase tracking-wider text-white-smoke/40">
                Full Name
              </span>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-background border border-default-border text-default-text px-3 py-2 font-jetbrains text-[12px] rounded-[5px] outline-none focus:border-system-red"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-jetbrains text-[9px] uppercase tracking-wider text-white-smoke/40">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border border-default-border text-default-text px-3 py-2 font-jetbrains text-[12px] rounded-[5px] outline-none focus:border-system-red"
              />
            </label>

            {error && (
              <div className="font-jetbrains text-[10px] text-system-red">{error}</div>
            )}
          </div>

          <div className="flex justify-end gap-2.5 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-[5px] font-jetbrains text-[10px] uppercase tracking-wider border border-default-border text-default-text hover:bg-tertiary-surface transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-[5px] font-jetbrains text-[10px] uppercase tracking-wider bg-default-text text-background hover:bg-transparent hover:text-system-red border border-transparent hover:border-system-red transition-colors disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
          </>
        )}
        </div>
      </div>
  
  );
}