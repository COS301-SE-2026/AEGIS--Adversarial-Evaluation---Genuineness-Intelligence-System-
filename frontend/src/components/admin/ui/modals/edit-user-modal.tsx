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

    const handleSave = async () => {
    if (!fullName.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(user, { full_name: fullName.trim(), email: email.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4">
      {/* Modal content  */}
    </div>
  );
}