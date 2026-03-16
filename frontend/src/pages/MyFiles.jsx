import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { 
  Search, 
  LayoutGrid, 
  List, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  MoreHorizontal,
  Plus,
  Filter
} from 'lucide-react';

const MyFiles = () => {
  const [viewMode, setViewMode] = useState('list');
  const [files] = useState([
    { id: 1, name: 'Project_Proposal.pdf', size: '2.4 MB', type: 'PDF', date: 'Mar 10, 2024', color: 'bg-red-50 text-red-500' },
    { id: 2, name: 'Budget_Sheet.xlsx', size: '1.1 MB', type: 'Excel', date: 'Mar 12, 2024', color: 'bg-green-50 text-green-500' },
    { id: 3, name: 'Dashboard_Design.png', size: '5.6 MB', type: 'Image', date: 'Mar 13, 2024', color: 'bg-purple-50 text-purple-500' },
    { id: 4, name: 'Meeting_Notes.docx', size: '850 KB', type: 'Doc', date: 'Mar 14, 2024', color: 'bg-blue-50 text-blue-500' },
  ]);

  const getFileIcon = (type) => {
    switch (type) {
      case 'PDF': return <FileText size={20} />;
      case 'Image': return <ImageIcon size={20} />;
      case 'Excel': return <FileSpreadsheet size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">

      <div className="flex-1 flex flex-col">
        <main className="p-6 lg:p-10 max-w-7xl mx-auto w-full animate-fade-in">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-bold text-[#13144D] tracking-tight">My Files</h1>
              <p className="text-slate-500 mt-1">Manage and organize your team's documents</p>
            </div>
            
            <div className="flex items-center gap-3">
               <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium">
                <Filter size={18} />
                Filters
              </button>
              <button className="flex items-center gap-2 bg-[#02E3A7] hover:bg-[#00c993] text-[#13144D] font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-[#02E3A7]/20 active:scale-95">
                <Plus size={20} />
                Upload File
              </button>
            </div>
          </div>

          {/* Search & View Toggle Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search documents, projects..." 
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
            
            <div className="flex p-1 bg-slate-200/50 rounded-xl self-start">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <LayoutGrid size={20} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Files Container */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">File Name</th>
                    <th className="px-6 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${file.color}`}>
                            {getFileIcon(file.type)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#13144D]">{file.name}</p>
                            <p className="text-[11px] text-slate-400 sm:hidden">{file.size} • {file.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          {file.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{file.size}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{file.date}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100" title="Download">
                            <Download size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100" title="Delete">
                            <Trash2 size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                            <MoreHorizontal size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {files.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                  <FileText size={48} className="text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-[#13144D]">No files found</h3>
                <p className="text-slate-400 max-w-xs mx-auto mt-2">Looks like you haven't uploaded anything yet. Start by clicking the upload button.</p>
                <button className="mt-8 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md">
                  Browse Files
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyFiles;