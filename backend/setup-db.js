const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: ''
});

conn.connect(err => {
  if (err) {
    console.error('Root connect failed:', err.message);
    process.exit(1);
  }
  console.log('Connected as root. Creating db and user...');
  
  conn.query("CREATE DATABASE IF NOT EXISTS mde_file_management;", (err) => {
    if (err) console.error('Error creating DB:', err);
    
    conn.query("CREATE USER IF NOT EXISTS 'mde_user'@'localhost' IDENTIFIED BY 'StrongPass2025!';", (err) => {
      if (err) console.error('Error creating user:', err);
      
      conn.query("GRANT ALL PRIVILEGES ON mde_file_management.* TO 'mde_user'@'localhost';", (err) => {
        if (err) console.error('Error granting privileges:', err);
        
        conn.query("FLUSH PRIVILEGES;", (err) => {
          if (err) console.error('Error flushing privileges:', err);
          console.log('DB setup complete.');
          
          conn.end();
        });
      });
    });
  });
});
