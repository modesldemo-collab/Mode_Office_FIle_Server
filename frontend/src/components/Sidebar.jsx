import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Clock, 
  Users, 
  Trash2, 
  CloudUpload,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'My Files', icon: <FolderOpen size={20} /> },
    { name: 'Recent', icon: <Clock size={20} /> },
    { name: 'Shared', icon: <Users size={20} /> },
    { name: 'Trash', icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="w-72 h-screen bg-gradient-to-b from-[#13144D] to-[#0B0C32] text-white flex flex-col sticky top-0 border-r border-white/5">
      
      {/* Brand Logo */}
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-[#02E3A7] p-2 rounded-lg shadow-[0_0_15px_rgba(2,227,167,0.4)] group-hover:scale-110 transition-transform">
            <CloudUpload className="text-[#13144D]" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            File<span className="text-[#02E3A7]">Server</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = activeTab === item.name;
          return (
            <div
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`group relative flex items-center justify-between px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200
                ${isActive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <div className="flex items-center gap-4 z-10">
                <span className={`${isActive ? 'text-[#02E3A7]' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              
              {isActive && (
                <>
                  <ChevronRight size={14} className="text-[#02E3A7]" />
                  {/* Selection Glow Indicator */}
                  <div className="absolute left-0 w-1 h-6 bg-[#02E3A7] rounded-r-full shadow-[0_0_10px_#02E3A7]" />
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Storage & User Section */}
      <div className="p-6 mt-auto">
        <div className="bg-gradient-to-br from-white/10 to-white/[0.02] p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Storage</p>
              <p className="text-sm font-bold text-white">75% Used</p>
            </div>
            <p className="text-[10px] text-gray-400">7.5 / 10 GB</p>
          </div>
          
          <div className="w-full bg-black/20 h-2 rounded-full mb-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-[#02E3A7] to-[#00ffbc] h-full rounded-full shadow-[0_0_8px_rgba(2,227,167,0.5)]" 
              style={{ width: '75%' }}
            />
          </div>

          <button className="w-full py-2 bg-[#02E3A7] hover:bg-[#02c994] text-[#13144D] text-xs font-bold rounded-lg transition-colors">
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;