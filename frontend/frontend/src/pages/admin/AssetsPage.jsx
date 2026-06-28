import React, { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, Database, User, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { AssetsAPI, UsersAPI, BASE_URL } from "../../api";
import { Modal } from "../../components/Modal";

// Quick timeAgo helper instead of moment
const timeAgo = (dateInput) => {
  if (!dateInput) return "";
  const diffMs = new Date() - new Date(dateInput);
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${diffSecs} SECONDS AGO`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} MINUTES AGO`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} HOURS AGO`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return `YESTERDAY`;
  return `${diffDays} DAYS AGO`;
};

export function AssetsPage() {
  const [data, setData] = useState({ stats: {}, assets: [], activities: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState(null);
  
  const [form, setForm] = useState({
    asset_id: "",
    asset_name: "",
    description: "",
    category: "Tech",
    serial_id: "",
    status: "Available",
    assigned_user_id: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  
  const fileInputRef = useRef(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [assetsRes, usersRes] = await Promise.all([
        AssetsAPI.list(),
        UsersAPI.list()
      ]);
      setData(assetsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      console.error("Failed to fetch assets", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const openCreate = () => {
    setEditAsset(null);
    setForm({
      asset_id: "",
      asset_name: "",
      description: "",
      category: "Tech",
      serial_id: "",
      status: "Available",
      assigned_user_id: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (a) => {
    setEditAsset(a);
    setForm({
      asset_id: a.asset_id || "",
      asset_name: a.asset_name,
      description: a.description || "",
      category: a.category || "Tech",
      serial_id: a.serial_id || "",
      status: a.status || "Available",
      assigned_user_id: a.assigned_user_id || "",
    });
    setImageFile(null);
    setImagePreview(a.image_path ? `${BASE_URL}/${a.image_path.replace(/\\/g, '/')}` : null);
    setError("");
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!form.asset_name) {
      setError("Asset Name is required.");
      return;
    }
    
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      Object.keys(form).forEach(key => {
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editAsset) {
        await AssetsAPI.update(editAsset.id, formData);
      } else {
        await AssetsAPI.create(formData);
      }
      
      await fetchAll();
      setModalOpen(false);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save asset");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await AssetsAPI.delete(id);
      fetchAll();
    } catch (err) {
      alert("Failed to delete asset");
    }
  };

  const renderStatus = (status) => {
    const s = status || 'Available';
    let classes = "";
    let dotClass = "";
    
    if (s === 'Available') {
      classes = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      dotClass = "bg-blue-500";
    } else if (s === 'In Use') {
      classes = "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
      dotClass = "bg-indigo-500";
    } else if (s === 'Maintenance') {
      classes = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      dotClass = "bg-red-500";
    } else {
      classes = "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
      dotClass = "bg-gray-500";
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
        {s}
      </span>
    );
  };

  if (loading && !data.assets.length) {
    return <div className="text-center py-10 text-[var(--text-muted)] animate-pulse">Loading Assets...</div>;
  }

  const { stats, assets, activities } = data;

  return (
    <div className="space-y-6">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg dark:bg-indigo-500/10 dark:text-indigo-400">All Assets</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--text-main)]">{stats.totalAssets || 0}</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Total Registered Assets</p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-400">Active</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--text-main)]">{stats.inUse || 0}</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Currently In Use</p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg dark:bg-blue-500/10 dark:text-blue-400">Ready</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--text-main)]">{stats.available || 0}</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Available Now</p>
        </div>

        <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5 flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg dark:bg-rose-500/10 dark:text-rose-400">Attention</span>
          </div>
          <h3 className="text-3xl font-extrabold text-[var(--text-main)]">{stats.inMaintenance || 0}</h3>
          <p className="text-sm font-medium text-[var(--text-muted)] mt-1">In Maintenance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Table Area */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-main)]">Global Inventory</h2>
              <p className="text-sm text-[var(--text-muted)]">Real-time status of all institutional resources.</p>
            </div>
            <button 
              onClick={openCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-md"
            >
              <Plus className="w-4 h-4" /> Add New Asset
            </button>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-main)] bg-[var(--bg-soft)]">
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Asset ID</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Asset Name</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Category</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Assigned User</th>
                  <th className="text-left px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Status</th>
                  <th className="text-right px-5 py-3 text-[var(--text-muted)] font-bold uppercase text-[10px] tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-main)]">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-8 text-center text-[var(--text-muted)]">No assets registered yet.</td>
                  </tr>
                ) : assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-[var(--bg-soft)] transition-colors">
                    <td className="px-5 py-4 font-semibold text-[var(--text-main)]">{asset.asset_id || `#AST-${asset.id}`}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {asset.image_path ? (
                          <img 
                            src={`${BASE_URL}/${asset.image_path.replace(/\\/g, '/')}`} 
                            alt={asset.asset_name}
                            className="w-8 h-8 rounded bg-gray-100 object-cover border border-gray-200 dark:border-gray-700" 
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-200 dark:border-gray-700">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-medium text-[var(--text-main)]">{asset.asset_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {asset.category || "General"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {asset.assigned_user_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-[10px] font-bold">
                            {asset.assigned_user_name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="text-[var(--text-main)]">{asset.assigned_user_name}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {renderStatus(asset.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(asset)} className="text-[var(--text-soft)] hover:text-indigo-500 p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Edit Asset">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(asset.id)} className="text-[var(--text-soft)] hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Delete Asset">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-6">
          <div className="bg-[var(--bg-panel)] border border-[var(--border-main)] rounded-2xl p-5">
            <h3 className="font-bold text-[var(--text-main)] mb-4 flex items-center gap-2">
               Recent Activity
            </h3>
            
            <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
              {activities.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">No recent activities.</p>
              ) : activities.map((act) => (
                <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white dark:border-slate-900 bg-indigo-100 text-indigo-500 dark:bg-indigo-900/50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ml-2.5 z-10">
                    <div className={`w-2 h-2 rounded-full ${act.action_type === 'Registered' ? 'bg-emerald-500' : act.action_type === 'Maintenance Logged' ? 'bg-rose-500' : 'bg-blue-500'}`} />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded border border-[var(--border-main)] bg-[var(--bg-soft)] shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-[var(--text-main)] text-sm">{act.action_type}</h4>
                      <time className="text-[10px] font-medium text-[var(--text-muted)] uppercase">{timeAgo(act.created_at)}</time>
                    </div>
                    <p className="text-xs text-[var(--text-soft)]">{act.description}</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1 italic">by {act.user_name || 'System'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editAsset ? "Edit Asset" : "Add New Asset"}>
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Asset Image</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-[var(--border-main)] bg-[var(--bg-soft)] hover:bg-[var(--bg-panel)] rounded-lg text-sm font-medium transition-colors"
                  >
                    Choose Image...
                  </button>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">Square images work best. Max size 5MB.</p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Asset Name *</label>
              <input
                type="text"
                value={form.asset_name}
                onChange={(e) => setForm({ ...form, asset_name: e.target.value })}
                placeholder="e.g. Dell Latitude 5430"
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Asset ID (Optional)</label>
              <input
                type="text"
                value={form.asset_id}
                onChange={(e) => setForm({ ...form, asset_id: e.target.value })}
                placeholder="e.g. #LAP-77241"
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Tech">Tech</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Furniture">Furniture</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Serial ID</label>
              <input
                type="text"
                value={form.serial_id}
                onChange={(e) => setForm({ ...form, serial_id: e.target.value })}
                placeholder="SN-XXXX"
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Details about the asset..."
                rows={3}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Initial Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="Available">Available</option>
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5 uppercase tracking-wider">Assigned User (Optional)</label>
              <select
                value={form.assigned_user_id}
                onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
                className="w-full bg-[var(--bg-soft)] border border-[var(--border-main)] rounded-lg px-4 py-2.5 text-[var(--text-main)] text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.username} ({u.email})</option>
                ))}
              </select>
            </div>

          </div>

          {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {saving ? "Saving..." : (editAsset ? "Save Changes" : "Register Asset")}
          </button>
        </div>
      </Modal>
    </div>
  );
}
