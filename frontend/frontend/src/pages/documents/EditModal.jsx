import React, { useState, useEffect } from "react";
import { DocsAPI } from "../../api";
import { Modal } from "../../components/Modal";

export function EditModal({ open, onClose, onSuccess, doc, departments, users }) {
  const [docName, setDocName] = useState("");
  const [deptId, setDeptId] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [status, setStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (doc) {
      setDocName(doc.doc_name || "");
      setDeptId(doc.dept_id || "");
      setStatus(doc.status || "draft");
      try {
        const rp =
          typeof doc.responsible_persons === "string"
            ? JSON.parse(doc.responsible_persons)
            : doc.responsible_persons || [];
        setSelectedUsers(rp);
      } catch {
        setSelectedUsers([]);
      }
    }
  }, [doc]);

  const toggleUser = (id) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSave = async () => {
    if (!docName.trim()) return setError("Name required");
    setError(""); setLoading(true);
    try {
      await DocsAPI.update(doc.id, {
        doc_name: docName,
        dept_id: deptId || null,
        responsible_persons: JSON.stringify(selectedUsers),
        status,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Document Metadata">
      <div className="space-y-3.5">
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Document Name *</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Department</label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">- Select Department -</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.dept_name}</option>
            ))}
          </select>
        </div>
        {users.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Related Users</label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl p-2.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-0.5 rounded-full text-xs font-medium transition-all border ${selectedUsers.includes(u.id)
                      ? "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800/50"
                      : "bg-[var(--bg-soft)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--text-soft)]"
                    }`}
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Status</label>
          <div className="flex gap-2">
            {["draft", "final"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${status === s
                    ? s === "final"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 dark:border-emerald-800/50"
                      : "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/50"
                    : "bg-[var(--bg-soft)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--text-soft)]"
                  }`}
              >
                {s === "final" ? "✓ Final" : "✎ Draft"}
              </button>
            ))}
          </div>
        </div>
        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2">{error}</div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
