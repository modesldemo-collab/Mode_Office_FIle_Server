import React from 'react';
import { Search, Upload, Bell, User } from 'lucide-react';

const Navbar = ({ onUploadClick }) => {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      {/* Search Bar */}
      <div className="relative w-1/3">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          placeholder="Search files..."
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {/* Right Side Buttons */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onUploadClick}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
        >
          <Upload size={18} />
          <span>Upload</span>
        </button>

        <button className="text-gray-500 hover:text-gray-700">
          <Bell size={20} />
        </button>

        <div className="flex items-center space-x-2 border-l pl-4 border-gray-200">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={18} className="text-gray-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">User Name</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;