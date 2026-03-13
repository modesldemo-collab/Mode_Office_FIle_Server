import React, { useState } from 'react';
import { 
  Folder, 
  HardDrive, 
  Clock, 
  Star, 
  Trash2, 
  Search, 
  Bell, 
  Plus,
  MoreVertical,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List
} from 'lucide-react'; 

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('grid');

  // Dummy data for files
  const files = [
    { id: 1, name: "Project_Proposal.pdf", size: "2.4 MB", type: "PDF", date: "Oct 12, 2023" },
    { id: 2, name: "Landing_Page_Design.png", size: "5.1 MB", type: "Image", date: "Oct 10, 2023" },
    { id: 3, name: "Backend_API_Docs.docx", size: "1.2 MB", type: "Doc", date: "Oct 08, 2023" },
    { id: 4, name: "Budget_2024.xlsx", size: "850 KB", type: "Spreadsheet", date: "Oct 05, 2023" },
  ];

  return (
    <div className="flex h-screen bg-brand-ghost font-sans text-brand-dark">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-brand-dark text-brand-white flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-brand-teal p-2 rounded-lg">
            <HardDrive size={24} className="text-brand-dark" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">CloudSafe</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<Folder size={20} />} label="All Files" active />
          <NavItem icon={<Clock size={20} />} label="Recent" />
          <NavItem icon={<Star size={20} />} label="Starred" />
          <NavItem icon={<Trash2 size={20} />} label="Trash" />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-white/10 p-4 rounded-xl">
            <p className="text-xs text-gray-400 mb-2">Storage (75%)</p>
            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-lime h-full w-3/4"></div>
            </div>
            <p className="text-[10px] mt-2 text-brand-teal">12.5 GB of 20 GB used</p>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <div className="relative w-96">
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Search files..." 
              className="w-full pl-10 pr-4 py-2 bg-brand-ghost rounded-full border-none focus:ring-2 focus:ring-brand-teal outline-none transition-all text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 hover:bg-brand-ghost rounded-full transition">
              <Bell size={20} />
            </button>
            <div className="h-8 w-8 bg-brand-teal rounded-full flex items-center justify-center font-bold text-brand-dark text-sm border-2 border-brand-dark/10">
              JD
            </div>
          </div>
        </header>

        {/* CONTENT AREA */}
        <section className="flex-1 overflow-y-auto p-8">
          
          {/* HEADER SECTION */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">My Files</h2>
              <p className="text-gray-500 text-sm">Welcome back! Manage your documents here.</p>
            </div>
            <button className="bg-brand-teal hover:bg-brand-lime text-brand-dark px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-teal/20 transition-all transform hover:-translate-y-0.5 active:scale-95">
              <Plus size={20} />
              Upload New
            </button>
          </div>

          {/* QUICK STATS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard title="Total Files" value="1,245" color="bg-white" />
            <StatCard title="Shared Items" value="48" color="bg-white" />
            <StatCard title="Recent Activity" value="+12 today" color="bg-white border-l-4 border-brand-teal" />
          </div>

          {/* FILES LIST SECTION */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-700">Recent Documents</h3>
              <div className="flex bg-gray-200 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50/30">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Type</th>
                    <th className="px-6 py-4 font-medium">Size</th>
                    <th className="px-6 py-4 font-medium">Modified</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-brand-ghost/50 transition cursor-pointer group">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal group-hover:bg-brand-teal group-hover:text-brand-dark transition">
                          {file.type === "Image" ? <ImageIcon size={18} /> : <FileText size={18} />}
                        </div>
                        <span className="font-medium text-sm">{file.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{file.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{file.date}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 hover:bg-gray-200 rounded-full transition">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

// --- HELPER COMPONENTS ---

const NavItem = ({ icon, label, active = false }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
    active ? 'bg-brand-teal text-brand-dark font-bold' : 'hover:bg-white/5 text-gray-300'
  }`}>
    {icon}
    <span className="text-sm">{label}</span>
  </div>
);

const StatCard = ({ title, value, color }) => (
  <div className={`${color} p-6 rounded-2xl shadow-sm border border-gray-100`}>
    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default Dashboard;