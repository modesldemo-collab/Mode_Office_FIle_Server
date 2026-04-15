import React, { useState, useEffect } from "react";
import { LogsAPI } from "../../api";
import { Modal } from "../../components/Modal";
import { ActionBadge } from "../../components/Badge";
import { formatDate } from "../../utils";
import { buildAuditSummary, humanAction } from "../../utils/auditFormat";

export function DocLogsModal({ open, onClose, docId }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (open && docId) {
      LogsAPI.forDoc(docId).then((r) => setLogs(r.data));
    }
  }, [open, docId]);

  return (
    <Modal open={open} onClose={onClose} title="Document History" wide>
      <div className="space-y-2">
        {logs.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-8">No history found</p>
        )}
        {logs.map((l) => (
          <div key={l.id} className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ActionBadge action={l.action_type} />
                <span className="text-cyan-300 text-sm font-medium">{humanAction(l.action_type)}</span>
              </div>
              <span className="text-slate-300 text-sm font-medium">{l.editor_name || "Unknown"}</span>
              <span className="text-slate-500 text-xs">{formatDate(l.changed_at)}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {buildAuditSummary(l).map((line) => (
                <li key={line} className="text-sm text-slate-300">- {line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
