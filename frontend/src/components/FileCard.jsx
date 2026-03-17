import React from 'react';
import { FileText, Image as ImageIcon, FileSpreadsheet, MoreVertical, Download, Trash2 } from 'lucide-react';

const FileCard = ({ file, onRefresh }) => {
  // File type එක අනුව Icon එක තෝරා ගැනීම
  const getFileIcon = (mimeType) => {
    if (mimeType.includes('image')) return <ImageIcon className="text-purple-500" />;
    if (mimeType.includes('pdf')) return <FileText className="text-red-500" />;
    if (mimeType.includes('csv') || mimeType.includes('sheet')) return <FileSpreadsheet className="text-green-500" />;
    return <FileText className="text-blue-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition group relative">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-white transition">
          {getFileIcon(file.mimeType || '')}
        </div>
        
        {/* Dropdown or Actions Button */}
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="mt-2">
        <h3 className="text-sm font-semibold text-gray-800 truncate" title={file.name}>
          {file.name}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {file.size ? `${(file.size / 1024).toFixed(1)} KB` : '0 KB'} • {new Date(file.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Hover එකේදී පෙන්වන Actions */}
      <div className="mt-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition">
        <button className="flex-1 flex justify-center items-center py-1.5 bg-gray-50 hover:bg-blue-50 text-blue-600 rounded-md transition border border-gray-100">
          <Download size={14} className="mr-1" /> <span className="text-xs">Download</span>
        </button>
        <button className="p-1.5 text-gray-400 hover:text-red-500 transition">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default FileCard;