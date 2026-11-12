-- ============================================================
-- MDE DIGITAL WORKSPACE / FILE MANAGEMENT SYSTEM — DATABASE SCHEMA
-- Ministry of Digital Economy, Sri Lanka
-- Compatible with MySQL 8.0 / Aiven Cloud MySQL / XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS `mde_file_management`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `mde_file_management`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `dept_name`  VARCHAR(100) NOT NULL UNIQUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT AUTO_INCREMENT PRIMARY KEY,
  `username`      VARCHAR(50) NOT NULL,
  `email`         VARCHAR(100) UNIQUE,
  `password_hash` TEXT NOT NULL,
  `dept_id`       INT,
  `role`          VARCHAR(20) DEFAULT 'user',
  `is_active`     TINYINT(1) DEFAULT 1,
  `created_at`    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Responsible Persons Table
CREATE TABLE IF NOT EXISTS `responsible_persons` (
  `id`      INT AUTO_INCREMENT PRIMARY KEY,
  `name`    VARCHAR(100) NOT NULL,
  `email`   VARCHAR(100),
  `dept_id` INT,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Documents Table
CREATE TABLE IF NOT EXISTS `documents` (
  `id`                  INT AUTO_INCREMENT PRIMARY KEY,
  `doc_name`            TEXT NOT NULL,
  `file_name`           TEXT NOT NULL,
  `file_path`           TEXT NOT NULL,
  `file_type`           VARCHAR(50),
  `file_size`           BIGINT DEFAULT 0,
  `uploader_id`         INT,
  `dept_id`             INT,
  `responsible_persons` JSON,
  `status`              VARCHAR(20) DEFAULT 'draft',
  `is_deleted`          TINYINT(1) DEFAULT 0,
  `created_at`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`dept_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
  CHECK (`status` IN ('draft', 'final'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Document Logs Table
CREATE TABLE IF NOT EXISTS `document_logs` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `doc_id`      INT,
  `edited_by`   INT,
  `action_type` VARCHAR(50),
  `old_value`   JSON,
  `new_value`   JSON,
  `changed_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`doc_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`edited_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Document Shares Table
CREATE TABLE IF NOT EXISTS `document_shares` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `doc_id`      INT NOT NULL,
  `shared_by`   INT,
  `shared_with` INT NOT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_doc_user` (`doc_id`, `shared_with`),
  FOREIGN KEY (`doc_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shared_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`shared_with`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Projects Table
CREATE TABLE IF NOT EXISTS `projects` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `project_name` VARCHAR(255) NOT NULL,
  `description`  TEXT NULL,
  `created_by`   INT NULL,
  `deadline`     DATE NULL,
  `status`       VARCHAR(20) DEFAULT 'active',
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Tasks Table
CREATE TABLE IF NOT EXISTS `tasks` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `project_id`  INT NULL,
  `task_name`   VARCHAR(255) NOT NULL,
  `assigned_by` INT,
  `assigned_to` INT,
  `deadline`    DATE NULL,
  `status`      VARCHAR(20) DEFAULT 'pending',
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assigned_by`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  CHECK (`status` IN ('pending', 'completed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Task Assignments Table
CREATE TABLE IF NOT EXISTS `task_assignments` (
  `id`              INT AUTO_INCREMENT PRIMARY KEY,
  `task_id`         INT NOT NULL,
  `user_id`         INT NOT NULL,
  `is_completed`    TINYINT(1) DEFAULT 0,
  `completed_at`    TIMESTAMP NULL DEFAULT NULL,
  `approval_status` VARCHAR(20) DEFAULT 'pending',
  `feedback`        TEXT NULL,
  `submitted_at`    TIMESTAMP NULL DEFAULT NULL,
  `submission_text` TEXT NULL,
  `file_name`       VARCHAR(255) NULL,
  `file_path`       VARCHAR(255) NULL,
  `file_size`       BIGINT NULL,
  `file_type`       VARCHAR(100) NULL,
  `created_at`      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_task_user` (`task_id`, `user_id`),
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Task Attachments Table
CREATE TABLE IF NOT EXISTS `task_attachments` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `task_id`     INT NOT NULL,
  `uploader_id` INT NULL,
  `file_name`   VARCHAR(255) NOT NULL,
  `file_path`   VARCHAR(255) NOT NULL,
  `file_size`   BIGINT DEFAULT 0,
  `file_type`   VARCHAR(100),
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploader_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`          INT NOT NULL,
  `notification_key` VARCHAR(191) NOT NULL,
  `type`             VARCHAR(50) NOT NULL,
  `title`            VARCHAR(255) NOT NULL,
  `body`             TEXT,
  `link`             VARCHAR(255),
  `is_read`          TINYINT(1) DEFAULT 0,
  `read_at`          TIMESTAMP NULL DEFAULT NULL,
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_notification_key` (`user_id`, `notification_key`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. GovScribe Drafts Table
CREATE TABLE IF NOT EXISTS `govscribe_drafts` (
  `user_id`                     INT PRIMARY KEY,
  `ref_no`                      VARCHAR(255),
  `your_no`                     VARCHAR(255),
  `date`                        VARCHAR(255),
  `recipient_designation`       VARCHAR(255),
  `recipient_company`           VARCHAR(255),
  `subject`                     TEXT,
  `body_content`                TEXT,
  `signatory_left_name`         VARCHAR(255),
  `signatory_left_designation`  VARCHAR(255),
  `signatory_right_name`        VARCHAR(255),
  `signatory_right_designation` VARCHAR(255),
  `selected_theme`              VARCHAR(50),
  `updated_at`                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. Assets Table
CREATE TABLE IF NOT EXISTS `assets` (
  `id`               INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id`         VARCHAR(50) UNIQUE,
  `asset_name`       VARCHAR(255) NOT NULL,
  `description`      TEXT,
  `category`         VARCHAR(100),
  `serial_id`        VARCHAR(100),
  `status`           VARCHAR(50) DEFAULT 'Available',
  `assigned_user_id` INT,
  `image_path`       VARCHAR(255),
  `created_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`assigned_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. Project Activities Table
CREATE TABLE IF NOT EXISTS `project_activities` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `project_id`  INT NOT NULL,
  `user_id`     INT,
  `action_type` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `task_id`     INT NULL,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. Asset Activities Table
CREATE TABLE IF NOT EXISTS `asset_activities` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `asset_id`    INT NOT NULL,
  `user_id`     INT,
  `action_type` VARCHAR(50) NOT NULL,
  `description` TEXT,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. Seed Default Admin (Email: admin@mde.gov.lk | Password: admin@MDE2025)
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`)
SELECT 'admin', 'admin@mde.gov.lk', '$2b$10$eSCHtJxh7nnHYwdcXCimnOF2vvQjpV/vKxTdGjRs7iKSINHgICzu.', 'admin'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `role` = 'admin' LIMIT 1
);

-- 17. Seed Test User (Email: testuser@mde.gov.lk | Password: test@MDE2025)
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`)
SELECT 'testuser', 'testuser@mde.gov.lk', '$2b$10$iQvimCDvnzVn/McgBb3y6OcVDJypbCxpXb2T.r.XX6E4tS.RO5JE6', 'user'
WHERE NOT EXISTS (
  SELECT 1 FROM `users` WHERE `email` = 'testuser@mde.gov.lk' LIMIT 1
);

