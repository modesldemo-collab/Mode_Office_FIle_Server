import React, { useCallback, useEffect, useState } from "react";
import { RotateCcw, Eye, Download } from "lucide-react";
import { DocsAPI } from "../api";
import { Badge } from "../components/Badge";
import { FileIcon } from "../components/FileIcon";
import { formatBytes, formatDate } from "../utils";
import { PreviewModal } from "./documents/PreviewModal";

export function CompletedDocumentsPage() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchCompleted = useCallback(async () => {
    setLoading(true);
    try {
      const r = await DocsAPI.list({ status: "final", page: 1, limit: 100 });
      setDocs(r.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompleted();
  }, [fetchCompleted]);

  const moveBackToDocuments = async (doc) => {
    if (!confirm("Move this document back to Documents page?")) return;
    await DocsAPI.update(doc.id, { status: "draft" });
    fetchCompleted();
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border-main)] bg-[var(--bg-panel)] p-5">
        <h2 className="text-[var(--text-main)] text-lg font-semibold">Completed Documents</h2>
        <p className="text-[var(--text-soft)] text-sm mt-1">
          Documents marked as completed are shown here. You can move them back to Documents.
        </p>
      </div>

      <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]">
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Document</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Size</th>
                <th className="text-left px-4 py-3 text-[var(--text-soft)] font-medium">Completed On</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="text-center py-12 text-[var(--text-soft)]">Loading...</td></tr>
              )}
              {!loading && docs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-[var(--text-soft)]">No completed documents yet</td></tr>
              )}
              {!loading && docs.map((doc) => (
                <tr key={doc.id} className="border-b border-[var(--border-main)] hover:bg-[var(--bg-soft)]/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <FileIcon type={doc.file_type} />
                      <div>
                        <p className="text-[var(--text-main)] font-medium leading-tight">{doc.doc_name}</p>
                        <p className="text-[var(--text-soft)] text-xs">{doc.file_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge status={doc.status} /></td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatBytes(doc.file_size)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(doc.updated_at || doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPreviewDoc(doc)} className="p-1.5 text-[var(--text-soft)] hover:text-cyan-500 rounded-lg hover:bg-cyan-500/10 transition-all" title="Preview">
                        <Eye className="w-4 h-4" />
                      </button>
                      <a href={DocsAPI.downloadUrl(doc.id)} download className="p-1.5 text-[var(--text-soft)] hover:text-blue-500 rounded-lg hover:bg-blue-500/10 transition-all" title="Download">
                        <Download className="w-4 h-4" />
                      </a>
                      <button onClick={() => moveBackToDocuments(doc)} className="p-1.5 text-[var(--text-soft)] hover:text-amber-500 rounded-lg hover:bg-amber-500/10 transition-all" title="Move back to Documents">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PreviewModal open={!!previewDoc} onClose={() => setPreviewDoc(null)} doc={previewDoc} />
    </div>
  );
}
