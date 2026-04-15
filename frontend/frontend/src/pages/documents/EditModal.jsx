import React, { useState, useEffect } from "react";
import { DocsAPI } from "../../api";
import { Modal } from "../../components/Modal";

export function EditModal({ open, onClose, onSuccess, doc, departments, users }) {
  const [docName, setDocName]                 = useState("");
  const [deptId, setDeptId]                   = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [status, setStatus]                   = useState("draft");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");

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
        doc_name:            docName,
        dept_id:             deptId || null,
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
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Document Name *</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Department</label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">— Select Department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.dept_name}</option>
            ))}
          </select>
        </div>
        {users.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Related Users</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedUsers.includes(u.id)
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "bg-slate-700 text-slate-400 border border-slate-600"
                  }`}
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Status</label>
          <div className="flex gap-3">
            {["draft", "final"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                  status === s
                    ? s === "final"
                      ? "bg-emerald-900/40 text-emerald-400 border-emerald-800/50"
                      : "bg-amber-900/40 text-amber-400 border-amber-800/50"
                    : "bg-slate-800 text-slate-400 border-slate-700"
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
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
