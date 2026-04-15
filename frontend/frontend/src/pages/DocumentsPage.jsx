import React, { useState, useEffect, useCallback } from "react";
import {
  Search, RefreshCw, Plus, Eye, Download, Pencil, ScrollText, Trash2, Send,
} from "lucide-react";
import { Auth, DocsAPI, Departments } from "../api";
import { useAuth } from "../context/AuthContext";
import { Badge } from "../components/Badge";
import { FileIcon } from "../components/FileIcon";
import { formatBytes, formatDate } from "../utils";
import { UploadModal } from "./documents/UploadModal";
import { EditModal } from "./documents/EditModal";
import { PreviewModal } from "./documents/PreviewModal";
import { DocLogsModal } from "./documents/DocLogsModal";
import { ShareModal } from "./documents/ShareModal";

export function DocumentsPage() {
  const { user } = useAuth();
  const [docs, setDocs]               = useState([]);
  const [total, setTotal]             = useState(0);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(false);
  const [page, setPage]               = useState(1);
  const limit = 20;

  const [search, setSearch]             = useState("");
  const [filterDept, setFilterDept]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterFolder, setFilterFolder] = useState("");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");

  const [uploadOpen, setUploadOpen] = useState(false);
  const [editDoc, setEditDoc]       = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [logsDocId, setLogsDocId]   = useState(null);
  const [shareDoc, setShareDoc]     = useState(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const r = await DocsAPI.list({
        search,
        dept_id:   filterDept,
        status:    filterStatus,
        folder:    filterFolder,
        from_date: fromDate,
        to_date:   toDate,
        page,
        limit,
      });
      setDocs(r.data.data);
      setTotal(r.data.total);
    } finally {
      setLoading(false);
    }
  }, [search, filterDept, filterStatus, filterFolder, fromDate, toDate, page]);

  useEffect(() => {
    Departments.list().then((r) => setDepartments(r.data));
    Auth.shareUsers().then((r) => setUsers(r.data));
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this document? This action is logged.")) return;
    await DocsAPI.delete(id);
    fetchDocs();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search documents…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => { setFilterDept(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.dept_name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
        <select
          value={filterFolder}
          onChange={(e) => { setFilterFolder(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500"
        >
          <option value="">{user?.role === "admin" ? "All Folder Views" : "My Folder (Own + Shared)"}</option>
          <option value="my">Uploaded By Me</option>
          <option value="shared">Shared</option>
        </select>
        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />
        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-cyan-500" />
        <button
          onClick={() => { setSearch(""); setFilterDept(""); setFilterStatus(""); setFilterFolder(""); setFromDate(""); setToDate(""); setPage(1); }}
          className="text-slate-400 hover:text-white p-2.5 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors"
          title="Clear filters"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Document</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Department</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Size</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Uploaded</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">By</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Loading…</td></tr>
              )}
              {!loading && docs.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">No documents found</td></tr>
              )}
              {!loading && docs.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileIcon type={doc.file_type} />
                      <div>
                        <p className="text-white font-medium leading-tight">{doc.doc_name}</p>
                        <p className="text-slate-500 text-xs">{doc.file_name}</p>
                        {doc.shared_with_me ? (
                          <p className="text-cyan-400 text-[11px]">Shared with you</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{doc.dept_name || "—"}</td>
                  <td className="px-4 py-3"><Badge status={doc.status} /></td>
                  <td className="px-4 py-3 text-slate-400">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3 text-slate-400">{doc.uploader_name || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewDoc(doc)} className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={DocsAPI.downloadUrl(doc.id)} download className="p-1.5 text-slate-500 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-all" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => setEditDoc(doc)} className="p-1.5 text-slate-500 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-all" title="Edit metadata">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setLogsDocId(doc.id)} className="p-1.5 text-slate-500 hover:text-violet-400 rounded-lg hover:bg-violet-500/10 transition-all" title="View history">
                        <ScrollText className="w-4 h-4" />
                      </button>
                      {(user?.role === "admin" || doc.uploader_id === user?.id) && (
                        <button onClick={() => setShareDoc(doc)} className="p-1.5 text-slate-500 hover:text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-all" title="Share">
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role === "admin" || doc.uploader_id === user?.id) && (
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">
                Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-700 transition-colors">
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={fetchDocs} departments={departments} users={users} />
      <EditModal open={!!editDoc} onClose={() => setEditDoc(null)} onSuccess={fetchDocs} doc={editDoc} departments={departments} users={users} />
      <PreviewModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} doc={previewDoc} />
      <DocLogsModal open={!!logsDocId} onClose={() => setLogsDocId(null)} docId={logsDocId} />
      <ShareModal
        open={!!shareDoc}
        onClose={() => setShareDoc(null)}
        onSuccess={fetchDocs}
        doc={shareDoc}
        users={users}
      />
    </div>
  );
}
