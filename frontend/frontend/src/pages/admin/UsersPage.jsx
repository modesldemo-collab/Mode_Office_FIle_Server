import React, { useState, useEffect } from "react";
import { Plus, Pencil } from "lucide-react";
import { UsersAPI, Departments } from "../../api";
import { Modal } from "../../components/Modal";

export function UsersPage() {
  const [users, setUsers]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [form, setForm] = useState({
    username: "", email: "", password: "",
    dept_id: "", role: "user", is_active: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const [pwdUser, setPwdUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const fetchAll = () => {
    UsersAPI.list().then((r) => setUsers(r.data));
    Departments.list().then((r) => setDepartments(r.data));
  };
  useEffect(fetchAll, []);

  const openCreate = () => {
    setEditUser(null);
    setForm({ username: "", email: "", password: "", dept_id: "", role: "user", is_active: 1 });
    setError("");
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ username: u.username, email: u.email, password: "", dept_id: u.dept_id || "", role: u.role, is_active: u.is_active });
    setError("");
    setModalOpen(true);
  };

  const openPasswordModal = (u) => {
    setPwdUser(u);
    setNewPassword("");
    setPwdError("");
    setPwdModalOpen(true);
  };

  const handleSave = async () => {
    setError(""); setLoading(true);
    try {
      if (editUser) {
        const { password, ...payload } = form;
        await UsersAPI.update(editUser.id, payload);
      } else {
        await UsersAPI.create(form);
      }
      fetchAll();
      setModalOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdError("");
    if (!newPassword || newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters");
      return;
    }

    setPwdLoading(true);
    try {
      await UsersAPI.changePassword(pwdUser.id, { new_password: newPassword });
      setPwdModalOpen(false);
    } catch (err) {
      setPwdError(err?.response?.data?.error || "Failed to update password");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/50">
              {["Username", "Email", "Department", "Role", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-slate-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="px-4 py-3 text-white font-medium">{u.username}</td>
                <td className="px-4 py-3 text-slate-400">{u.email}</td>
                <td className="px-4 py-3 text-slate-400">{u.dept_name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
                    u.role === "admin"
                      ? "bg-violet-900/40 text-violet-400 border-violet-800/50"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${u.is_active ? "bg-emerald-400" : "bg-slate-600"}`} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(u)} className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10" title="Edit user">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => openPasswordModal(u)} className="text-slate-500 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-cyan-500/10" title="Change password">
                      PW
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? "Edit User" : "Add User"}>
        <div className="space-y-4">
          {[
            { label: "Username", key: "username", type: "text" },
            { label: "Email",    key: "email",    type: "email" },
            ...(!editUser ? [{ label: "Password", key: "password", type: "password" }] : []),
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>
              <input
                type={type}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.dept_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Active</label>
              <select value={form.is_active} onChange={(e) => setForm({ ...form, is_active: parseInt(e.target.value) })}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value={1}>Active</option>
                <option value={0}>Inactive</option>
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={handleSave} disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>

      <Modal open={pwdModalOpen} onClose={() => setPwdModalOpen(false)} title={`Set Password: ${pwdUser?.username || "User"}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>
          {pwdError && <p className="text-red-400 text-sm">{pwdError}</p>}
          <button onClick={handleChangePassword} disabled={pwdLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {pwdLoading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
