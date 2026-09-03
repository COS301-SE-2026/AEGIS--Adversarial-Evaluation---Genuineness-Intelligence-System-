import React, { useEffect } from 'react';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  headerText?: string;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  successMessage?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  headerText = "Confirm Action",
  title = "Are you sure you want to proceed?",
  description = "Please verify your configurations before confirming.",
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  isDanger = false,
  successMessage,
  isLoading = false,
  errorMessage = null,
}: ModalProps) => {



  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <button
        type="button"
        aria-label="Close modal"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        className="relative z-50 w-full max-w-md bg-secondary-surface border border-tertiary-surface rounded-lg shadow-2xl overflow-hidden flex flex-col"
      >
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-tertiary-surface">
          <h2 id="confirmation-modal-title" className="text-default-text text-sm font-bold tracking-widest uppercase">
            {headerText}
          </h2>
          <button 
            type="button"
            onClick={onClose}
            className="text-default-border hover:text-default-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          {successMessage ? (
            <div className="py-8 text-center">
              <div className="font-staatliches text-[18px] tracking-[0.05em] text-status-success">
                {successMessage}
              </div>

              <p className="mt-2 font-jetbrains text-[10px] text-white-smoke/50">
                The user was deleted successfully.
              </p>
            </div>
          ) : (
            <div className="flex gap-4">
              <div
                className={`mt-0.5 ${
                  isDanger ? "text-system-red" : "text-status-warning"
                }`}
              >
                {isDanger ? (
                  <AlertTriangle size={20} />
                ) : (
                  <AlertCircle size={20} />
                )}
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-default-text">
                  {title}
                </h3>

                <p className="text-sm leading-relaxed text-default-border">
                  {description}
                </p>

                {errorMessage && (
                  <p className="mt-3 text-sm text-system-red">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {!successMessage && (
          <div className="flex items-center justify-end gap-3 border-t border-tertiary-surface px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded border border-default-border/45 px-4 py-2 text-center font-staatliches text-sm tracking-wider text-default-border transition-all duration-150 hover:border-default-border hover:text-default-text"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`cursor-pointer rounded border px-5 py-2 text-center font-staatliches text-sm tracking-wider transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                isDanger
                  ? "border-system-red bg-system-red/10 text-system-red hover:bg-system-red/20"
                  : "border-status-success bg-status-success/10 text-status-success hover:bg-status-success/20"
              }`}
            >
              {isLoading ? "DELETING..." : confirmText}
            </button>
          </div>
        )}
        
      </div>
    </div>
  );
}

export default ConfirmationModal;