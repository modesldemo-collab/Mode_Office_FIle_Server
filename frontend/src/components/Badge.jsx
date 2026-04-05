import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export function Badge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "final"
          ? "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
          : "bg-amber-900/40 text-amber-400 border border-amber-800/50"
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
    UPLOAD:          "bg-blue-900/40 text-blue-400 border-blue-800/50",
    UPDATE_METADATA: "bg-purple-900/40 text-purple-400 border-purple-800/50",
    STATUS_CHANGE:   "bg-amber-900/40 text-amber-400 border-amber-800/50",
    DELETE:          "bg-red-900/40 text-red-400 border-red-800/50",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
        map[action] || "bg-slate-800 text-slate-400 border-slate-700"
      }`}
    >
      {action}
    </span>
  );
}
