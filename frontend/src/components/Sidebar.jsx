import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, Clock, 
  Users, Trash2, CloudUpload, ChevronRight 
} from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'My Files', path: '/my-files', icon: <FolderOpen size={20} /> },
    { name: 'Recent', path: '/recent', icon: <Clock size={20} /> },
    { name: 'Shared', path: '/shared', icon: <Users size={20} /> },
    { name: 'Trash', path: '/trash', icon: <Trash2 size={20} /> },
  ];

  return (
    <div className="w-72 h-screen bg-gradient-to-b from-[#13144D] to-[#0B0C32] text-white flex flex-col sticky top-0 border-r border-white/5">
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="bg-[#02E3A7] p-2 rounded-lg shadow-[0_0_15px_rgba(2,227,167,0.4)]">
            <CloudUpload className="text-[#13144D]" size={24} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">File<span className="text-[#02E3A7]">Server</span></h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `
              group relative flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200
              ${isActive ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-4 z-10">
                  <span className={isActive ? 'text-[#02E3A7]' : 'text-gray-400 group-hover:text-white'}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                {isActive && (
                  <>
                    <ChevronRight size={14} className="text-[#02E3A7]" />
                    <div className="absolute left-0 w-1 h-6 bg-[#02E3A7] rounded-r-full shadow-[0_0_10px_#02E3A7]" />
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Storage & Upgrade UI remains the same */}
      <div className="p-6 mt-auto">
         {/* ... (keep your existing Storage UI here) */}
      </div>
    </div>
  );
};

export default Sidebar;