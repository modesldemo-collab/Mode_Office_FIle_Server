import React, { useState, useEffect, useCallback } from "react";
import { FileSpreadsheet, FileText, History } from "lucide-react";
import { LogsAPI } from "../api";
import { ActionBadge } from "../components/Badge";
import { formatDate } from "../utils";
import { buildAuditSummary, humanAction } from "../utils/auditFormat";

export function LogsPage() {
  const [logs, setLogs]                 = useState([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await LogsAPI.list({
        action_type: actionFilter,
        from_date:   fromDate,
        to_date:     toDate,
        page,
        limit,
      });
      setLogs(r.data.data);
      setTotal(r.data.total);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, fromDate, toDate, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const maxPage = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5 transition-colors duration-300">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-500 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[var(--text-main)] text-lg font-semibold">Audit Activity</h2>
            <p className="text-[var(--text-soft)] text-sm">
              A human-readable timeline of important actions in the system.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-4">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Actions</option>
          <option value="UPLOAD">UPLOAD</option>
          <option value="UPDATE_METADATA">UPDATE_METADATA</option>
          <option value="DELETE">DELETE</option>
          <option value="SHARE">SHARE</option>
          <option value="UNSHARE">UNSHARE</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-3 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500" />

        <div className="ml-auto flex gap-2">
          <button
            onClick={LogsAPI.exportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700/30 hover:bg-emerald-700/50 text-emerald-400 text-sm font-medium rounded-xl border border-emerald-700/50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export Excel
          </button>
          <button
            onClick={LogsAPI.exportPdf}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-700/30 hover:bg-red-700/50 text-red-400 text-sm font-medium rounded-xl border border-red-700/50 transition-colors"
          >
            <FileText className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-4 md:p-5 space-y-3 transition-colors duration-300">
        {loading && (
          <p className="text-center py-10 text-[var(--text-soft)]">Loading activity...</p>
        )}
        {!loading && logs.length === 0 && (
          <p className="text-center py-10 text-[var(--text-soft)]">No logs found</p>
        )}

        {!loading && logs.map((log) => (
          <div key={log.id} className="rounded-xl border border-[var(--border-main)] bg-[var(--bg-soft)] p-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <ActionBadge action={log.action_type} />
                <p className="text-[var(--text-main)] font-medium">{humanAction(log.action_type)}</p>
              </div>
              <p className="text-xs text-[var(--text-soft)]">{formatDate(log.changed_at)}</p>
            </div>

            <p className="text-sm text-[var(--text-main)] mt-2">
              <span className="font-semibold">{log.editor_name || "System"}</span> on
              <span className="font-semibold"> {log.doc_name || "Unknown Document"}</span>
            </p>

            <ul className="mt-3 space-y-1">
              {buildAuditSummary(log).map((line) => (
                <li key={line} className="text-sm text-[var(--text-muted)]">- {line}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex items-center justify-between px-1 pt-2">
          <p className="text-[var(--text-soft)] text-sm">Total: {total} entries</p>
          <div className="flex gap-2 items-center">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-soft)] border border-[var(--border-main)] text-[var(--text-main)] disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-[var(--text-soft)] text-sm">Page {page} / {maxPage}</span>
            <button onClick={() => setPage((p) => Math.min(maxPage, p + 1))} disabled={page >= maxPage}
              className="px-3 py-1.5 text-sm rounded-lg bg-[var(--bg-soft)] border border-[var(--border-main)] text-[var(--text-main)] disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
