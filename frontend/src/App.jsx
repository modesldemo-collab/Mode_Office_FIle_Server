import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';

// Import your pages based on the file tree
import Dashboard from './pages/Dashboard';
import MyFiles from './pages/MyFiles';
// // import Recent from './pages/recent'; // Note: check if 'r' is lowercase in your file
// import Shared from './pages/shared';
// import Trash from './pages/trash';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#0B0C32]">
        {/* Sidebar stays fixed on the left */}
        <Sidebar />

        {/* Dynamic Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/my-files" element={<MyFiles />} />
            {/* <Route path="/recent" element={<Recent />} />
            <Route path="/shared" element={<Shared />} />
            <Route path="/trash" element={<Trash />} /> */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;