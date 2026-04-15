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
      <div className="space-y-5">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragging
              ? "border-cyan-500 bg-cyan-500/10"
              : "border-slate-700 hover:border-slate-500 bg-slate-800/40"
          }`}
        >
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileIcon type={file.name.split(".").pop()} />
              <div className="text-left">
                <p className="text-white font-medium text-sm">{file.name}</p>
                <p className="text-slate-400 text-xs">{formatBytes(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="ml-2 text-slate-500 hover:text-red-400"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-300 text-sm font-medium">
                Drag & drop or click to select
              </p>
              <p className="text-slate-500 text-xs mt-1">
                PDF, DOCX, XLSX, PPT, Images, Audio — up to 200 MB
              </p>
            </>
          )}
        </div>

        {loading && (
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Document Name *
          </label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            placeholder="e.g. Annual Budget Report 2025"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Department
          </label>
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
            <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
              Related Users (optional)
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto bg-slate-800/50 border border-slate-700 rounded-lg p-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleUser(u.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    selectedUsers.includes(u.id)
                      ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50"
                      : "bg-slate-700 text-slate-400 border border-slate-600 hover:border-slate-500"
                  }`}
                >
                  {u.username}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Status
          </label>
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
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500"
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
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
        >
          {loading ? `Uploading… ${progress}%` : "Upload Document"}
        </button>
      </div>
    </Modal>
  );
}
