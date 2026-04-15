import React, { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { Departments } from "../../api";

export function DepartmentsPage() {
  const [depts, setDepts]       = useState([]);
  const [name, setName]         = useState("");
  const [editId, setEditId]     = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading]   = useState(false);

  const fetchDepts = useCallback(() => {
    Departments.list().then((r) => setDepts(r.data));
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await Departments.create({ dept_name: name });
    setName("");
    fetchDepts();
    setLoading(false);
  };

  const handleUpdate = async (id) => {
    await Departments.update(id, { dept_name: editName });
    setEditId(null);
    fetchDepts();
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this department?")) return;
    await Departments.delete(id);
    fetchDepts();
  };

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="New department name"
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
        <button onClick={handleCreate} disabled={loading}
          className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {depts.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-10">No departments yet</p>
        )}
        {depts.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0">
            <Building2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
            {editId === d.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
                <button onClick={() => handleUpdate(d.id)} className="text-cyan-400 text-sm font-medium">Save</button>
                <button onClick={() => setEditId(null)} className="text-slate-500 text-sm">Cancel</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-white">{d.dept_name}</span>
                <button onClick={() => { setEditId(d.id); setEditName(d.dept_name); }}
                  className="text-slate-500 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(d.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
