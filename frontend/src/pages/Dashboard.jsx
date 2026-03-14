import React from 'react';
import { 
  Folder, HardDrive, Search, Plus, Clock, Star, Trash2, 
  FileText, Image as ImageIcon, MoreVertical 
} from 'lucide-react';

const Dashboard = () => {
  // --- CSS Styles (Internal) ---
  const styles = {
    container: {
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f1f5f9',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      color: '#1e293b'
    },
    sidebar: {
      width: '260px',
      backgroundColor: '#0f172a',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px'
    },
    logoSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '40px'
    },
    navItem: (active) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '12px',
      cursor: 'pointer',
      marginBottom: '8px',
      backgroundColor: active ? '#334155' : 'transparent',
      color: active ? '#22d3ee' : '#94a3b8',
      transition: 'all 0.3s'
    }),
    main: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },
    header: {
      height: '70px',
      backgroundColor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 40px',
      borderBottom: '1px solid #e2e8f0'
    },
    searchBox: {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      padding: '8px 16px',
      borderRadius: '20px',
      width: '350px',
      gap: '10px'
    },
    uploadBtn: {
      backgroundColor: '#0ea5e9',
      color: '#fff',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      cursor: 'pointer',
      fontWeight: '600'
    },
    content: {
      padding: '40px',
      overflowY: 'auto'
    },
    tableCard: {
      backgroundColor: '#fff',
      borderRadius: '16px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'left',
      padding: '16px 24px',
      backgroundColor: '#f8fafc',
      color: '#64748b',
      fontSize: '12px',
      textTransform: 'uppercase'
    },
    td: {
      padding: '16px 24px',
      borderBottom: '1px solid #f1f5f9',
      fontSize: '14px'
    }
  };

  const files = [
    { id: 1, name: "Project_Proposal.pdf", size: "2.4 MB", type: "PDF" },
    { id: 2, name: "Landing_Design.png", size: "5.1 MB", type: "Image" },
    { id: 3, name: "Budget_2024.xlsx", size: "850 KB", type: "Spreadsheet" },
  ];

  return (
    <div style={styles.container}>
      {/* --- SIDEBAR --- */}
      <aside style={styles.sidebar}>
        <div style={styles.logoSection}>
          <div style={{ backgroundColor: '#22d3ee', padding: '8px', borderRadius: '10px' }}>
            <HardDrive size={24} color="#0f172a" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>CloudSafe</h2>
        </div>

        <nav>
          <div style={styles.navItem(true)}><Folder size={20} /> All Files</div>
          <div style={styles.navItem(false)}><Clock size={20} /> Recent</div>
          <div style={styles.navItem(false)}><Star size={20} /> Starred</div>
          <div style={styles.navItem(false)}><Trash2 size={20} /> Trash</div>
        </nav>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main style={styles.main}>
        <header style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search files..." 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} 
            />
          </div>
          <button style={styles.uploadBtn}>
            <Plus size={20} /> Upload New
          </button>
        </header>

        <section style={styles.content}>
          <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>My Documents</h2>
          
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}></th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {file.type === "Image" ? <ImageIcon size={18} color="#0ea5e9" /> : <FileText size={18} color="#64748b" />}
                        <span style={{ fontWeight: '500' }}>{file.name}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{ backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>
                        {file.type}
                      </span>
                    </td>
                    <td style={styles.td}>{file.size}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      <MoreVertical size={16} color="#94a3b8" cursor="pointer" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;