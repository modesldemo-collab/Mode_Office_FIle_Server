require('dotenv').config();
const { db } = require('./models/db');
const bcrypt = require('bcryptjs');

async function seedDemoData() {
  try {
    console.log("Seeding demo projects...");
    
    // Check if test user exists, otherwise create
    const [testUsers] = await db.query(
      "SELECT id FROM users WHERE email = 'testuser@mde.gov.lk' LIMIT 1"
    );
    let userId;
    if (testUsers.length === 0) {
      const hash = await bcrypt.hash("test@MDE2025", 10);
      const [res] = await db.query(
        "INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)",
        ["testuser", "testuser@mde.gov.lk", hash, "user"]
      );
      userId = res.insertId;
      console.log("Created test user.");
    } else {
      userId = testUsers[0].id;
      console.log("Using existing test user (testuser@mde.gov.lk).");
    }

    const projects = [
      {
        name: "Smart City Traffic Management System",
        description: "Implementing AI-driven traffic lights and congestion monitoring across the metropolitan area.",
        deadline: "2026-11-30",
        tasks: [
          { name: "Install IoT sensors at 50 major intersections", deadline: "2026-08-15" },
          { name: "Develop real-time traffic analysis algorithm using AI", deadline: "2026-09-20" },
          { name: "Integrate system with central police control room API", deadline: "2026-10-10" },
          { name: "Conduct user acceptance testing (UAT) with traffic police", deadline: "2026-11-05" }
        ]
      },
      {
        name: "National Healthcare Data Integration",
        description: "Centralizing patient health records across all public hospitals for seamless access.",
        deadline: "2027-03-15",
        tasks: [
          { name: "Audit current fragmented hospital databases", deadline: "2026-09-01" },
          { name: "Design unified FHIR compliant API for data exchange", deadline: "2026-11-15" },
          { name: "Conduct security and penetration testing on central server", deadline: "2027-01-10" },
          { name: "Pilot launch at National General Hospital", deadline: "2027-02-20" }
        ]
      },
      {
        name: "Green Energy Grid Upgrade Phase 1",
        description: "Connecting newly established solar and wind power plants to the national grid efficiently.",
        deadline: "2026-12-31",
        tasks: [
          { name: "Survey potential solar farm locations in the dry zone", deadline: "2026-07-25" },
          { name: "Draft standardized contracts for private energy suppliers", deadline: "2026-08-30" },
          { name: "Upgrade transmission lines in the Northern Province", deadline: "2026-11-05" },
          { name: "Install smart meters for industrial consumers", deadline: "2026-12-10" }
        ]
      },
      {
        name: "Budget Proposal 2027 - Ministry of Digital Economy",
        description: "Preparation and finalization of the comprehensive budget proposal for the fiscal year 2027.",
        deadline: "2026-10-31",
        tasks: [
          { name: "Gather financial requirements from all departments", deadline: "2026-08-15" },
          { name: "Draft initial budget allocation report", deadline: "2026-09-10" },
          { name: "Review draft with the Ministry Secretary", deadline: "2026-09-25" },
          { name: "Submit final proposal to the Treasury", deadline: "2026-10-20" }
        ]
      }
    ];

    for (const p of projects) {
      const [existing] = await db.query(
        "SELECT id FROM projects WHERE project_name = ? AND created_by = ?",
        [p.name, userId]
      );
      if (existing.length > 0) {
        console.log(`\nProject already exists: ${p.name}`);
        continue;
      }

      const [pRes] = await db.query(
        "INSERT INTO projects (project_name, description, created_by, deadline, status) VALUES (?,?,?,?,?)",
        [p.name, p.description, userId, p.deadline, "active"]
      );
      const projectId = pRes.insertId;
      console.log(`\nAdded Project: ${p.name}`);

      for (const t of p.tasks) {
        const [tRes] = await db.query(
          "INSERT INTO tasks (project_id, task_name, assigned_by, assigned_to, deadline, status) VALUES (?,?,?,?,?,?)",
          [projectId, t.name, userId, userId, t.deadline, "pending"]
        );
        const taskId = tRes.insertId;
        
        await db.query(
          "INSERT INTO task_assignments (task_id, user_id, is_completed, completed_at) VALUES (?,?,?,?)",
          [taskId, userId, 0, null]
        );
        console.log(`  - Added Task: ${t.name}`);
      }
    }

    console.log("\nDemo seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding demo data:", err);
    process.exit(1);
  }
}

seedDemoData();
