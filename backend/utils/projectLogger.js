const { db } = require("../models/db");

const logProjectActivity = async (projectId, userId, actionType, description, taskId = null) => {
  if (!projectId) return;
  try {
    await db.query(
      "INSERT INTO project_activities (project_id, user_id, action_type, description, task_id) VALUES (?, ?, ?, ?, ?)",
      [projectId, userId || null, actionType, description, taskId]
    );
  } catch (err) {
    console.error("Failed to log project activity:", err);
  }
};

module.exports = { logProjectActivity };

