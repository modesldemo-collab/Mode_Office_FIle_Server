import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, Send } from "lucide-react";
import { DocsAPI } from "../../api";
import { Modal } from "../../components/Modal";

export function ShareModal({ open, onClose, onSuccess, doc, users }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [initialIds, setInitialIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !doc?.id) return;

    let alive = true;
    setError("");
    DocsAPI.listShares(doc.id)
      .then((res) => {
        if (!alive) return;
        const ids = (res.data || []).map((row) => row.shared_with);
        setInitialIds(ids);
        setSelectedIds(ids);
      })
      .catch((err) => {
        if (!alive) return;
        setError(err?.response?.data?.error || "Failed to load existing shares");
      });

    return () => {
      alive = false;
    };
  }, [open, doc?.id]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.username, u.email, u.dept_name].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [users, search]);

  const toggleUser = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!doc?.id) return;

    setLoading(true);
    setError("");

    const toAdd = selectedIds.filter((id) => !initialIds.includes(id));
    const toRemove = initialIds.filter((id) => !selectedIds.includes(id));

    try {
      if (toAdd.length) {
        await DocsAPI.share(doc.id, { shared_with_ids: toAdd });
      }
      if (toRemove.length) {
        await Promise.all(toRemove.map((uid) => DocsAPI.unshare(doc.id, uid)));
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update sharing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Share: ${doc?.doc_name || "Document"}`}>
      <div className="space-y-4">
        <p className="text-sm text-slate-400">
          Select users who can see this file in their Documents folder.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name/email/department"
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
        />

        <div className="max-h-64 overflow-y-auto bg-slate-800/40 border border-slate-700 rounded-lg p-2 space-y-2">
          {filteredUsers.length === 0 && (
            <p className="text-sm text-slate-500 px-2 py-4 text-center">No users found</p>
          )}

          {filteredUsers.map((u) => {
            const checked = selectedIds.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  checked
                    ? "border-cyan-500/40 bg-cyan-500/10"
                    : "border-slate-700 hover:border-slate-500 bg-slate-900/40"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUser(u.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium">{u.username}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                  <p className="text-xs text-slate-500">{u.dept_name || "No department"}</p>
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? "Saving shares..." : "Save Sharing"}
        </button>
      </div>
    </Modal>
  );
}
