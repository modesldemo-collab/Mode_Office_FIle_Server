import React from "react";
import {
  Folder,
  HardDrive,
  Search,
  Plus,
  Clock,
  Star,
  Trash2,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Cloud,
} from "lucide-react";

const Dashboard = () => {
  const files = [
    { id: 1, name: "Project_Proposal.pdf", size: "2.4 MB", type: "PDF" },
    { id: 2, name: "Landing_Design.png", size: "5.1 MB", type: "Image" },
    { id: 3, name: "Budget_2024.xlsx", size: "850 KB", type: "Spreadsheet" },
    { id: 4, name: "MarketingPlan.docx", size: "1.3 MB", type: "DOC" },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">

      {/* SIDEBAR */}
      <aside className="w-[260px] bg-gradient-to-b from-slate-900 to-slate-800 text-white flex flex-col p-6">

        <div className="flex items-center gap-3 mb-10">
          <div className="bg-cyan-400 p-2 rounded-lg">
            <Cloud size={24} className="text-slate-900" />
          </div>
          <h2 className="text-xl font-bold">CloudSafe</h2>
        </div>

        <nav className="space-y-2">

          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700 text-cyan-400 cursor-pointer">
            <Folder size={20} /> All Files
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer">
            <Clock size={20} /> Recent
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer">
            <Star size={20} /> Starred
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-slate-800 cursor-pointer">
            <Trash2 size={20} /> Trash
          </div>

        </nav>

        {/* STORAGE */}
        <div className="mt-auto bg-slate-800 rounded-xl p-4">
          <p className="text-sm text-slate-400 mb-2">Storage</p>
          <div className="w-full bg-slate-700 h-2 rounded-full">
            <div className="bg-cyan-400 h-2 rounded-full w-2/3"></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">6.5 GB of 10 GB used</p>
        </div>

      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* HEADER */}
        <header className="h-[70px] bg-white flex items-center justify-between px-10 border-b">

          <div className="flex items-center bg-slate-100 px-4 py-2 rounded-full w-[350px] gap-2">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search files..."
              className="bg-transparent outline-none w-full"
            />
          </div>

          <button className="bg-gradient-to-r from-sky-500 to-cyan-400 hover:opacity-90 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold shadow">
            <Plus size={20} /> Upload
          </button>

        </header>

        {/* CONTENT */}
        <section className="p-10 overflow-y-auto">

          {/* QUICK STATS */}
          <div className="grid grid-cols-3 gap-6 mb-10">

            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
              <p className="text-slate-400 text-sm">Total Files</p>
              <h3 className="text-2xl font-bold mt-2">128</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
              <p className="text-slate-400 text-sm">Storage Used</p>
              <h3 className="text-2xl font-bold mt-2">6.5 GB</h3>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
              <p className="text-slate-400 text-sm">Shared Files</p>
              <h3 className="text-2xl font-bold mt-2">32</h3>
            </div>

          </div>

          <h2 className="mb-6 text-2xl font-bold">My Documents</h2>

          {/* FILE TABLE */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">

            <table className="w-full">

              <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-6 py-4">Name</th>
                  <th className="text-left px-6 py-4">Type</th>
                  <th className="text-left px-6 py-4">Size</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>

              <tbody>

                {files.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b last:border-none hover:bg-slate-50 transition"
                  >

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">

                        {file.type === "Image" ? (
                          <ImageIcon size={18} className="text-sky-500" />
                        ) : (
                          <FileText size={18} className="text-slate-500" />
                        )}

                        <span className="font-medium">{file.name}</span>

                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="bg-slate-100 px-3 py-1 rounded text-xs">
                        {file.type}
                      </span>
                    </td>

                    <td className="px-6 py-4">{file.size}</td>

                    <td className="px-6 py-4 text-right">
                      <MoreVertical
                        className="text-slate-400 cursor-pointer"
                        size={16}
                      />
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </section>

      </main>
    </div>
  );
};

export default Dashboard;