/**
 * models/db.js — MySQL connection pool and DB initialisation
 */

const mysql  = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const db = mysql.createPool({
  host:             process.env.DB_HOST || "localhost",
  port:             process.env.DB_PORT || 3306,
  user:             process.env.DB_USER || "root",
  password:         process.env.DB_PASS || "",
  database:         process.env.DB_NAME || "mde_file_management",
  waitForConnections: true,
  connectionLimit:  10,
});

async function columnExists(conn, tableName, columnName) {
  const [rows] = await conn.query(
    "SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1",
    [tableName, columnName]
  );
  return rows.length > 0;
}

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
      CREATE TABLE IF NOT EXISTS projects (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        project_name  VARCHAR(255) NOT NULL,
        description   TEXT NULL,
        created_by    INT NULL,
        deadline      DATE NULL,
        status        VARCHAR(20) DEFAULT 'active',
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        project_id   INT NULL,
        task_name    VARCHAR(255) NOT NULL,
        assigned_by  INT,
        assigned_to  INT,
        deadline     DATE NULL,
        status       VARCHAR(20)  DEFAULT 'pending',
        created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (project_id)  REFERENCES projects(id) ON DELETE CASCADE,
        CHECK (status IN ('pending','completed'))
      )
    `);

    if (!(await columnExists(conn, "tasks", "project_id"))) {
      await conn.query("ALTER TABLE tasks ADD COLUMN project_id INT NULL AFTER id");
      await conn.query("ALTER TABLE tasks ADD CONSTRAINT fk_tasks_project_id FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE");
    }

    if (!(await columnExists(conn, "tasks", "deadline"))) {
      await conn.query("ALTER TABLE tasks ADD COLUMN deadline DATE NULL AFTER assigned_to");
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS task_assignments (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        task_id       INT NOT NULL,
        user_id       INT NOT NULL,
        is_completed  TINYINT(1) DEFAULT 0,
        completed_at  TIMESTAMP NULL DEFAULT NULL,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_task_user (task_id, user_id),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    if (!(await columnExists(conn, "task_assignments", "approval_status"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending' AFTER completed_at");
    }

    if (!(await columnExists(conn, "task_assignments", "feedback"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN feedback TEXT NULL AFTER approval_status");
    }

    if (!(await columnExists(conn, "task_assignments", "submitted_at"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN submitted_at TIMESTAMP NULL DEFAULT NULL AFTER feedback");
    }

    if (!(await columnExists(conn, "task_assignments", "submission_text"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN submission_text TEXT NULL AFTER submitted_at");
    }

    if (!(await columnExists(conn, "task_assignments", "file_name"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN file_name VARCHAR(255) NULL AFTER submission_text");
    }

    if (!(await columnExists(conn, "task_assignments", "file_path"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN file_path VARCHAR(255) NULL AFTER file_name");
    }

    if (!(await columnExists(conn, "task_assignments", "file_size"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN file_size BIGINT NULL AFTER file_path");
    }

    if (!(await columnExists(conn, "task_assignments", "file_type"))) {
      await conn.query("ALTER TABLE task_assignments ADD COLUMN file_type VARCHAR(100) NULL AFTER file_size");
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS task_attachments (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        task_id      INT NOT NULL,
        uploader_id  INT NULL,
        file_name    VARCHAR(255) NOT NULL,
        file_path    VARCHAR(255) NOT NULL,
        file_size    BIGINT DEFAULT 0,
        file_type    VARCHAR(100),
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
        FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        user_id          INT NOT NULL,
        notification_key VARCHAR(191) NOT NULL,
        type             VARCHAR(50) NOT NULL,
        title            VARCHAR(255) NOT NULL,
        body             TEXT,
        link             VARCHAR(255),
        is_read          TINYINT(1) DEFAULT 0,
        read_at          TIMESTAMP NULL DEFAULT NULL,
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_notification_key (user_id, notification_key),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS govscribe_drafts (
        user_id                     INT PRIMARY KEY,
        ref_no                      VARCHAR(255),
        your_no                     VARCHAR(255),
        date                        VARCHAR(255),
        recipient_designation       VARCHAR(255),
        recipient_company           VARCHAR(255),
        subject                     TEXT,
        body_content                TEXT,
        signatory_left_name         VARCHAR(255),
        signatory_left_designation  VARCHAR(255),
        signatory_right_name        VARCHAR(255),
        signatory_right_designation VARCHAR(255),
        selected_theme              VARCHAR(50),
        updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id               INT AUTO_INCREMENT PRIMARY KEY,
        asset_id         VARCHAR(50) UNIQUE,
        asset_name       VARCHAR(255) NOT NULL,
        description      TEXT,
        category         VARCHAR(100),
        serial_id        VARCHAR(100),
        status           VARCHAR(50) DEFAULT 'Available',
        assigned_user_id INT,
        image_path       VARCHAR(255),
        created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS project_activities (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        project_id  INT NOT NULL,
        user_id     INT,
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        task_id     INT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS asset_activities (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        asset_id    INT NOT NULL,
        user_id     INT,
        action_type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Backfill old single-assignee tasks into task_assignments once.
    await conn.query(
      `INSERT IGNORE INTO task_assignments (task_id, user_id, is_completed, completed_at)
       SELECT t.id,
              t.assigned_to,
              CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END,
              CASE WHEN t.status = 'completed' THEN t.updated_at ELSE NULL END
       FROM tasks t
       WHERE t.assigned_to IS NOT NULL`
    );

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

    // Seed test user if none exists
    const [testUsers] = await conn.query(
      "SELECT id FROM users WHERE email = 'testuser@mde.gov.lk' LIMIT 1"
    );
    let testUserId;
    if (testUsers.length === 0) {
      const hash = await bcrypt.hash("test@MDE2025", 10);
      const [res] = await conn.query(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)",
        ["testuser", "testuser@mde.gov.lk", hash, "user"]
      );
      testUserId = res.insertId;
      console.log("✅  Test user created: testuser@mde.gov.lk / test@MDE2025");
    } else {
      testUserId = testUsers[0].id;
    }

    // Seed dummy projects for test user
    const [testProjects] = await conn.query(
      "SELECT id FROM projects WHERE created_by = ? LIMIT 1", [testUserId]
    );
    
    if (testProjects.length === 0) {
      const [p1] = await conn.query(
        "INSERT INTO projects (project_name, description, created_by, deadline, status) VALUES (?,?,?,?,?)",
        ["Digital Transformation Initiative 2026", "A strategic project to digitize government processes.", testUserId, "2026-12-31", "active"]
      );
      const [p2] = await conn.query(
        "INSERT INTO projects (project_name, description, created_by, deadline, status) VALUES (?,?,?,?,?)",
        ["National E-ID System Rollout", "Implementation of the new electronic identity card system nationwide.", testUserId, "2026-10-15", "active"]
      );
      
      const p1Id = p1.insertId;
      const p2Id = p2.insertId;

      // Seed dummy tasks for test user
      const [t1] = await conn.query(
        "INSERT INTO tasks (project_id, task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?,?)",
        [p1Id, "Finalize vendor selection for cloud infrastructure", testUserId, testUserId, "2026-07-15", "pending"]
      );
      const [t2] = await conn.query(
        "INSERT INTO tasks (project_id, task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?,?)",
        [p1Id, "Draft initial policy guidelines", testUserId, testUserId, "2026-08-01", "completed"]
      );
      const [t3] = await conn.query(
        "INSERT INTO tasks (project_id, task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?,?)",
        [p2Id, "Review biometric security standards", testUserId, testUserId, "2026-07-10", "pending"]
      );

      // Add to task_assignments
      await conn.query("INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at) VALUES (?,?,?,?)", [t1.insertId, testUserId, 0, null]);
      await conn.query("INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at) VALUES (?,?,?,?)", [t2.insertId, testUserId, 1, new Date()]);
      await conn.query("INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at) VALUES (?,?,?,?)", [t3.insertId, testUserId, 0, null]);

      console.log("✅  Test projects and tasks seeded for test user.");
    }

    console.log("✅  Database initialised");
  } finally {
    conn.release();
  }
}

module.exports = { db, initDB };
