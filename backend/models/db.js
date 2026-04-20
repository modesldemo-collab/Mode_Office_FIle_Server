/**
 * models/db.js — MySQL connection pool and DB initialisation
 */

const mysql  = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const db = mysql.createPool({
  host:             process.env.DB_HOST || "localhost",
  user:             process.env.DB_USER || "root",
  password:         process.env.DB_PASS || "",
  database:         process.env.DB_NAME || "mde_file_management",
  waitForConnections: true,
  connectionLimit:  10,
});

// ── Schema bootstrap ─────────────────────────────────────────
async function initDB() {
  const conn = await db.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        dept_name  VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        username      VARCHAR(50) NOT NULL,
        email         VARCHAR(100) UNIQUE,
        password_hash TEXT NOT NULL,
        dept_id       INT,
        role          VARCHAR(20) DEFAULT 'user',
        is_active     TINYINT(1)  DEFAULT 1,
        created_at    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS responsible_persons (
        id      INT AUTO_INCREMENT PRIMARY KEY,
        name    VARCHAR(100) NOT NULL,
        email   VARCHAR(100),
        dept_id INT,
        FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id                   INT AUTO_INCREMENT PRIMARY KEY,
        doc_name             TEXT NOT NULL,
        file_name            TEXT NOT NULL,
        file_path            TEXT NOT NULL,
        file_type            VARCHAR(50),
        file_size            BIGINT      DEFAULT 0,
        uploader_id          INT,
        dept_id              INT,
        responsible_persons  JSON,
        status               VARCHAR(20) DEFAULT 'draft',
        is_deleted           TINYINT(1)  DEFAULT 0,
        created_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        updated_at           TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id)        ON DELETE SET NULL,
        FOREIGN KEY (dept_id)     REFERENCES departments(id)  ON DELETE SET NULL,
        CHECK (status IN ('draft','final'))
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS document_logs (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        doc_id      INT,
        edited_by   INT,
        action_type VARCHAR(50),
        old_value   JSON,
        new_value   JSON,
        changed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (doc_id)    REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (edited_by) REFERENCES users(id)     ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS document_shares (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        doc_id         INT NOT NULL,
        shared_by      INT,
        shared_with    INT NOT NULL,
        created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_doc_user (doc_id, shared_with),
        FOREIGN KEY (doc_id)      REFERENCES documents(id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by)   REFERENCES users(id)     ON DELETE SET NULL,
        FOREIGN KEY (shared_with) REFERENCES users(id)     ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        task_name    VARCHAR(255) NOT NULL,
        assigned_by  INT,
        assigned_to  INT,
        status       VARCHAR(20)  DEFAULT 'pending',
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        CHECK (status IN ('pending','completed'))
      )
    `);

    // Seed default admin if none exists
    const [admins] = await conn.query(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    if (admins.length === 0) {
      const hash = await bcrypt.hash("admin@MDE2025", 10);
      await conn.query(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)",
        ["admin", "admin@mde.gov.lk", hash, "admin"]
      );
      console.log("✅  Default admin created: admin@mde.gov.lk / admin@MDE2025");
    }

    console.log("✅  Database initialised");
  } finally {
    conn.release();
  }
}

module.exports = { db, initDB };
