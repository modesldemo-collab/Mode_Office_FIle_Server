import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { PersonsAPI, Departments } from "../../api";
import { Modal } from "../../components/Modal";

export function PersonsPage() {
  const [persons, setPersons]         = useState([]);
  const [departments, setDepartments] = useState([]);
  const [modalOpen, setModalOpen]     = useState(false);
  const [form, setForm] = useState({ name: "", email: "", dept_id: "" });
  const [loading, setLoading]         = useState(false);

  const fetchAll = useCallback(() => {
    PersonsAPI.list().then((r) => setPersons(r.data));
    Departments.list().then((r) => setDepartments(r.data));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await PersonsAPI.create(form);
    setForm({ name: "", email: "", dept_id: "" });
    setModalOpen(false);
    fetchAll();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this person?")) return;
    await PersonsAPI.delete(id);
    fetchAll();
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex justify-end">
        <button onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {persons.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-10">No persons added yet</p>
        )}
        {persons.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
            <UserCheck className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{p.name}</p>
              {p.email && <p className="text-slate-500 text-xs">{p.email}</p>}
            </div>
            <span className="text-slate-500 text-xs">{p.dept_name || "—"}</span>
            <button onClick={() => handleDelete(p.id)}
              className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Responsible Person">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Department</label>
            <select value={form.dept_id} onChange={(e) => setForm({ ...form, dept_id: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">None</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.dept_name}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
            {loading ? "Saving…" : "Add Person"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
