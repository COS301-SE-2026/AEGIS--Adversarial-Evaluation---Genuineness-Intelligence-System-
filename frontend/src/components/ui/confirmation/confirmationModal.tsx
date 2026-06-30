import React from 'react';
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
  isDanger = false
}: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-50 w-full max-w-md bg-secondary-surface border border-tertiary-surface rounded-lg shadow-2xl overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between px-5 py-4 border-b border-tertiary-surface">
          <h2 className="text-default-text text-sm font-bold tracking-widest uppercase">
            {headerText}
          </h2>
          <button 
            onClick={onClose}
            className="text-default-border hover:text-default-text transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-4">
            <div className={`mt-0.5 ${isDanger ? 'text-system-red' : 'text-status-warning'}`}>
              {isDanger ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
            </div>
            <div>
              <h3 className="text-default-text text-sm font-semibold mb-2">
                {title}
              </h3>
              <p className="text-default-border text-sm leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-tertiary-surface flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="py-2 px-4 text-center rounded font-staatliches text-sm tracking-wider border transition-all duration-150 border-default-border/45 text-default-border hover:text-default-text hover:border-default-border cursor-pointer"
          >
            {cancelText}
          </button>
          
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-2 px-5 text-center rounded font-staatliches text-sm tracking-wider border transition-all duration-150 cursor-pointer ${
              isDanger 
                ? 'border-system-red text-system-red bg-system-red/10 hover:bg-system-red/20' 
                : 'border-status-success text-status-success bg-status-success/10 hover:bg-status-success/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default ConfirmationModal;