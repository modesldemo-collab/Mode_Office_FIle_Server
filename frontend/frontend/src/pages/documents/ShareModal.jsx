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
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-muted)]">
          Select users who can see this file in their Documents folder.
        </p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name/email/department"
          className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
        />

        <div className="max-h-48 overflow-y-auto bg-[var(--bg-soft)]/40 border border-[var(--border-main)] rounded-xl p-2 space-y-1.5">
          {filteredUsers.length === 0 && (
            <p className="text-sm text-[var(--text-soft)] px-2 py-4 text-center">No users found</p>
          )}

          {filteredUsers.map((u) => {
            const checked = selectedIds.includes(u.id);
            return (
              <label
                key={u.id}
                className={`flex items-start gap-3 px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                  checked
                    ? "border-cyan-500/40 bg-cyan-500/10 dark:border-cyan-500/30 dark:bg-cyan-500/10"
                    : "border-[var(--border-main)] hover:border-[var(--text-soft)] bg-[var(--bg-soft)]/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleUser(u.id)}
                  className="mt-1"
                />
                <div className="min-w-0">
                  <p className="text-sm text-[var(--text-main)] font-semibold">{u.username}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{u.email}</p>
                  <p className="text-xs text-[var(--text-soft)]">{u.dept_name || "No department"}</p>
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
          className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {loading ? "Saving shares..." : "Save Sharing"}
        </button>
      </div>
    </Modal>
  );
}
