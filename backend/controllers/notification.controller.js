const { db } = require("../models/db");

const list = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const offset = Math.max(Number(req.query.offset) || 0, 0);

  const [rows] = await db.query(
    `SELECT id, type, title, body, link, is_read, read_at, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [req.user.id, limit, offset]
  );

  const [[{ unread_count: unreadCount }]] = await db.query(
    "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0",
    [req.user.id]
  );

  res.json({ data: rows, unread_count: Number(unreadCount || 0) });
};

const markRead = async (req, res) => {
  const notificationId = Number(req.params.id);
  const [result] = await db.query(
    `UPDATE notifications
     SET is_read = 1, read_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [notificationId, req.user.id]
  );

  if (!result.affectedRows) {
    return res.status(404).json({ error: "Notification not found" });
  }

  res.json({ message: "Notification marked as read" });
};

const markAllRead = async (req, res) => {
  await db.query(
    `UPDATE notifications
     SET is_read = 1, read_at = NOW()
     WHERE user_id = ? AND is_read = 0`,
    [req.user.id]
  );

  res.json({ message: "All notifications marked as read" });
};

module.exports = { list, markRead, markAllRead };
