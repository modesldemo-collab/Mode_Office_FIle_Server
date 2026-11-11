import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "final"
          ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50"
          : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50"
      }`}
    >
      {status === "final" ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Clock className="w-3 h-3" />
      )}
      {status === "final" ? "Final" : "Draft"}
    </span>
  );
}

export function ActionBadge({ action }) {
  const map = {
    UPLOAD:          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-800/50",
    UPDATE_METADATA: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-400 dark:border-purple-800/50",
    STATUS_CHANGE:   "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50",
    DELETE:          "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-400 dark:border-red-800/50",
    SHARE:           "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800/50",
    UNSHARE:         "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/40 dark:text-orange-400 dark:border-orange-800/50",
  };

  const labelMap = {
    UPDATE_METADATA: "UPDATE",
  };

  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
        map[action] || "bg-[var(--bg-soft)] text-[var(--text-main)] border-[var(--border-main)]"
      }`}
    >
      {labelMap[action] || action}
    </span>
  );
}
