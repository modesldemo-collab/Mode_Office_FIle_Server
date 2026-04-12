import React, { useState, useEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown, ChevronsUpDown, FileSpreadsheet, FileText } from "lucide-react";
import { LogsAPI } from "../api";
import { ActionBadge } from "../components/Badge";
import { formatDate } from "../utils";

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

  const columnHelper = createColumnHelper();
  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      size: 60,
      cell: (i) => <span className="text-slate-500 text-xs">#{i.getValue()}</span>,
    }),
    columnHelper.accessor("doc_name", {
      header: "Document",
      cell: (i) => <span className="text-white font-medium">{i.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("editor_name", {
      header: "Edited By",
      cell: (i) => <span className="text-slate-300">{i.getValue() || "—"}</span>,
    }),
    columnHelper.accessor("action_type", {
      header: "Action",
      cell: (i) => <ActionBadge action={i.getValue()} />,
    }),
    columnHelper.accessor("old_value", {
      header: "Old Value",
      cell: (i) => (
        <pre className="text-xs text-red-300/70 max-w-xs truncate">
          {i.getValue() ? JSON.stringify(i.getValue()) : "—"}
        </pre>
      ),
    }),
    columnHelper.accessor("new_value", {
      header: "New Value",
      cell: (i) => (
        <pre className="text-xs text-emerald-300/70 max-w-xs truncate">
          {i.getValue() ? JSON.stringify(i.getValue()) : "—"}
        </pre>
      ),
    }),
    columnHelper.accessor("changed_at", {
      header: "Timestamp",
      cell: (i) => (
        <span className="text-slate-400 text-xs whitespace-nowrap">
          {formatDate(i.getValue())}
        </span>
      ),
    }),
  ];

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Actions</option>
          <option value="UPLOAD">UPLOAD</option>
          <option value="UPDATE_METADATA">UPDATE_METADATA</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />
        <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />

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

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-800 bg-slate-950/50">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left px-4 py-3 text-slate-400 font-medium cursor-pointer select-none"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {h.column.getIsSorted() === "asc"  ? <ChevronUp className="w-3 h-3" /> :
                         h.column.getIsSorted() === "desc" ? <ChevronDown className="w-3 h-3" /> :
                         <ChevronsUpDown className="w-3 h-3 opacity-30" />}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">Loading…</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="text-center py-12 text-slate-500">No logs found</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <p className="text-slate-500 text-sm">Total: {total} entries</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40">Prev</button>
            <span className="px-3 py-1.5 text-slate-400 text-sm">
              Page {page} / {Math.ceil(total / limit) || 1}
            </span>
            <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / limit)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
