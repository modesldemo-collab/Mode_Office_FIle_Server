import React from 'react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', icon: '📊', active: true },
    { name: 'My Files', icon: '📁', active: false },
    { name: 'Recent', icon: '🕒', active: false },
    { name: 'Shared', icon: '🤝', active: false },
    { name: 'Trash', icon: '🗑️', active: false },
  ];

  return (
    <div className="w-64 h-screen bg-[#13144D] text-white flex flex-col sticky top-0">
      {/* Logo Section */}
      <div className="p-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-[#02E3A7]">File</span>Server
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.name}
            className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300
              ${item.active 
                ? 'bg-[#02E3A7] text-[#13144D] font-bold shadow-lg shadow-[#02E3A7]/20' 
                : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-sm">{item.name}</span>
          </div>
        ))}
      </nav>

      {/* Storage Indicator */}
      <div className="p-6">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <p className="text-xs text-gray-400 mb-2">Storage Used</p>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-[#02E3A7] h-full w-[70%]"></div>
          </div>
          <p className="text-[10px] mt-2 text-gray-400">7.5 GB of 10 GB used</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;