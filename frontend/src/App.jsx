import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard'; // Dashboard එක තියෙන තැන නිවැරදිව දාන්න
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default path එක Dashboard එකට redirect කරනවා */}
          <Route path="/" element={<Navigate to="/dashboard" />} />
          
          {/* Dashboard Route එක */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-files" element={<Dashboard />} />

          {/* ඉදිරියට Login පිටුව හැදුවම මෙතනට add කරන්න පුළුවන් */}
          {/* <Route path="/login" element={<Login />} /> */}

          {/* වැරදි URL එකක් ගැහුවොත් Dashboard එකටම යවන විදිහ (404 alternative) */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;