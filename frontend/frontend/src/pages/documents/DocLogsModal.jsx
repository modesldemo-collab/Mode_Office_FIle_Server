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
          <p className="text-[var(--text-soft)] text-sm text-center py-8">No history found</p>
        )}
        {logs.map((l) => (
          <div key={l.id} className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ActionBadge action={l.action_type} />
                <span className="text-cyan-600 dark:text-cyan-400 text-sm font-bold">{humanAction(l.action_type)}</span>
              </div>
              <span className="text-[var(--text-main)] text-sm font-semibold">{l.editor_name || "Unknown"}</span>
              <span className="text-[var(--text-soft)] text-xs">{formatDate(l.changed_at)}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {buildAuditSummary(l).map((line) => (
                <li key={line} className="text-sm text-[var(--text-muted)]">- {line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
