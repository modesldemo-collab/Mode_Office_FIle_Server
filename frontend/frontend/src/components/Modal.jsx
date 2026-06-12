import React from "react";
import { X } from "lucide-react";

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full ${
          wide ? "max-w-4xl" : "max-w-lg"
        } max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-main)]">
          <h3 className="text-lg font-semibold text-[var(--text-main)]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[var(--text-soft)] hover:text-[var(--text-main)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-5 text-[var(--text-main)]">{children}</div>
      </div>
    </div>
  );
}
