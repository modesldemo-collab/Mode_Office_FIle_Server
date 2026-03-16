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
} from "lucide-react";

const Dashboard = () => {
  const files = [
    { id: 1, name: "Project_Proposal.pdf", size: "2.4 MB", type: "PDF" },
    { id: 2, name: "Landing_Design.png", size: "5.1 MB", type: "Image" },
    { id: 3, name: "Budget_2024.xlsx", size: "850 KB", type: "Spreadsheet" },
  ];

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      
      
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

          <button className="bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 rounded-xl flex items-center gap-2 font-semibold">
            <Plus size={20} /> Upload New
          </button>
        </header>

        {/* CONTENT */}
        <section className="p-10 overflow-y-auto">
          <h2 className="mb-6 text-2xl font-bold">My Documents</h2>

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
                  <tr key={file.id} className="border-b last:border-none">
                    
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
                      <MoreVertical className="text-slate-400 cursor-pointer" size={16} />
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