import React, { useState, useRef } from "react";
import { Upload, AlertCircle, XCircle } from "lucide-react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { Modal } from "../../components/Modal";
import { FileIcon } from "../../components/FileIcon";
import { formatBytes } from "../../utils";

export function UploadModal({ open, onClose, onSuccess, departments, users }) {
  const { user } = useAuth();
  const [file, setFile]                       = useState(null);
  const [docName, setDocName]                 = useState("");
  const [deptId, setDeptId]                   = useState(user?.dept_id || "");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [status, setStatus]                   = useState("draft");
  const [dragging, setDragging]               = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [progress, setProgress]               = useState(0);
  const [error, setError]                     = useState("");
  const fileRef = useRef();

  const reset = () => {
    setFile(null); setDocName(""); setDeptId(user?.dept_id || "");
    setSelectedUsers([]); setStatus("draft"); setProgress(0); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name); }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name); }
  };

  const toggleUser = (id) =>
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (!file) return setError("Please select a file");
    if (!docName.trim()) return setError("Document name is required");
    setError(""); setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file",                file);
      fd.append("doc_name",            docName);
      fd.append("dept_id",             deptId || "");
      fd.append("responsible_persons", JSON.stringify(selectedUsers));
      fd.append("status",              status);

      await api.post("/api/documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) =>
          setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      onSuccess();
      handleClose();
    } catch (err) {
      setError(err?.response?.data?.error || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document">
      <div className="space-y-3.5">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragging
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-[var(--border-main)] hover:border-cyan-500/50 bg-[var(--bg-soft)]/50"
          }`}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileIcon type={file.name.split(".").pop()} />
              <div className="text-left">
                <p className="text-[var(--text-main)] font-medium text-sm">{file.name}</p>
                <p className="text-[var(--text-soft)] text-xs">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 text-[var(--text-soft)] hover:text-red-500"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-[var(--text-soft)] mx-auto mb-2" />
              <p className="text-[var(--text-muted)] text-sm font-medium">
                Drag & drop or click to select
              </p>
              <p className="text-[var(--text-soft)] text-xs mt-0.5">
                PDF, DOCX, XLSX, PPT, Images, Audio — up to 200 MB
              </p>
            </>
          )}
        </div>

        {loading && (
          <div className="h-1.5 bg-[var(--bg-soft)] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Document Name *
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Annual Budget Report 2025"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Department
          </label>
          <select
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-xl px-4 py-2 text-[var(--text-main)] text-sm focus:outline-none focus:border-cyan-500"
          >
            <option value="">— Select Department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.dept_name}</option>
            ))}
          </select>
        </div>

        {users.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              Related Users (optional)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-[var(--bg-soft)]/50 border border-[var(--border-main)] rounded-xl p-2.5">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-0.5 rounded-full text-xs font-medium transition-all border ${
                    selectedUsers.includes(u.id)
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
          <label className="block text-xs font-bold text-[var(--text-muted)] mb-1 uppercase tracking-wider">
            Status
          </label>
          <div className="flex gap-2">
            {["draft", "final"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                  status === s
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
          <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-4 w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
        >
          {loading ? `Uploading… ${progress}%` : "Upload Document"}
        </button>
      </div>
    </Modal>
  );
}
