import React, { useState, useEffect } from "react";
import { LogsAPI } from "../../api";
import { Modal } from "../../components/Modal";
import { ActionBadge } from "../../components/Badge";
import { formatDate } from "../../utils";

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
              <ActionBadge action={l.action_type} />
              <span className="text-slate-300 text-sm font-medium">{l.editor_name || "Unknown"}</span>
              <span className="text-slate-500 text-xs">{formatDate(l.changed_at)}</span>
            </div>
            {(l.old_value || l.new_value) && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                {l.old_value && (
                  <div>
                    <p className="text-slate-500 mb-1">Before</p>
                    <pre className="bg-slate-900 rounded-lg p-2 text-red-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(l.old_value, null, 2)}
                    </pre>
                  </div>
                )}
                {l.new_value && (
                  <div>
                    <p className="text-slate-500 mb-1">After</p>
                    <pre className="bg-slate-900 rounded-lg p-2 text-emerald-300 whitespace-pre-wrap break-all">
                      {JSON.stringify(l.new_value, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
