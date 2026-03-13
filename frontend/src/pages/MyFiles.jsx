import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const MyFiles = () => {
  
  const [files] = useState([
    { id: 1, name: 'Project_Proposal.pdf', size: '2.4 MB', type: 'PDF', date: '2024-03-10' },
    { id: 2, name: 'Budget_Sheet.xlsx', size: '1.1 MB', type: 'Excel', date: '2024-03-12' },
    { id: 3, name: 'Dashboard_Design.png', size: '5.6 MB', type: 'Image', date: '2024-03-13' },
    { id: 4, name: 'Meeting_Notes.docx', size: '850 KB', type: 'Doc', date: '2024-03-14' },
  ]);

  return (
    <div className="flex min-h-screen bg-[#F4F5F6]">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* <Navbar /> */}
        
        <main className="p-8 animate-fade-in">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#13144D]">My Files</h2>
              <p className="text-sm text-gray-500">Manage and organize your uploaded documents</p>
            </div>
            
            <div className="flex gap-3">
              <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                {/* Grid View Icon */}
                <span className="text-lg">⊞</span>
              </button>
              <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                {/* List View Icon */}
                <span className="text-lg">≡</span>
              </button>
            </div>
          </div>

          {/* Files Content Area */}
          <div className="brand-card overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100 text-[#13144D] text-sm font-semibold">
                <tr>
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Date Uploaded</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-[#F4F5F6]/50 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#02E3A7]/10 flex items-center justify-center text-[#02E3A7]">
                        {/* File Icon based on type */}
                        {file.type === 'PDF' ? '📄' : file.type === 'Image' ? '🖼️' : '📁'}
                      </div>
                      <span className="text-sm font-medium text-[#13144D]">{file.name}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.size}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{file.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 hover:bg-white rounded-md text-blue-500" title="Download">⬇️</button>
                        <button className="p-1.5 hover:bg-white rounded-md text-red-500" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State (If no files) */}
            {files.length === 0 && (
              <div className="py-20 text-center">
                <div className="text-5xl mb-4">📁</div>
                <h3 className="text-lg font-bold text-[#13144D]">No files found</h3>
                <p className="text-gray-400">Upload your first file to get started</p>
                <button className="btn-primary mt-6">+ Upload Now</button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MyFiles;