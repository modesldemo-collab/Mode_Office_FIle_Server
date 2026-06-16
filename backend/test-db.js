const mysql = require('mysql2/promise');

async function fixGrantsAndTest() {
  console.log('Connecting as root...');
  const rootConn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('Granting privileges to mde_user@localhost...');
    await rootConn.query("GRANT ALL PRIVILEGES ON mde_file_management.* TO 'mde_user'@'localhost'");
    await rootConn.query("FLUSH PRIVILEGES");
    console.log('Privileges granted and flushed successfully.');
  } catch (err) {
    console.error('Failed to grant privileges:', err.message);
  } finally {
    await rootConn.end();
  }

  console.log('\nTesting connection as mde_user...');
  try {
    const userConn = await mysql.createConnection({
      host: 'localhost',
      user: 'mde_user',
      password: 'StrongPass2025!',
      database: 'mde_file_management'
    
    });
    console.log('Successfully connected to mde_file_management as mde_user!');
    await userConn.end();
  } catch (err) {
    console.error('Failed to connect as mde_user:', err.message);
  }
}

fixGrantsAndTest();
