import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; 

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-files" element={<Dashboard />} />

          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;