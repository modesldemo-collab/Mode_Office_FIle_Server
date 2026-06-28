/**
 * controllers/asset.controller.js
 */

const { db } = require("../models/db");

// Get all assets + statistics + recent activities for the dashboard
exports.getDashboardData = async (req, res) => {
  try {
    const conn = await db.getConnection();

    try {
      // 1. Get statistics
      const [[{ totalAssets }]] = await conn.query("SELECT COUNT(*) as totalAssets FROM assets");
      const [[{ inUse }]] = await conn.query("SELECT COUNT(*) as inUse FROM assets WHERE status = 'In Use'");
      const [[{ available }]] = await conn.query("SELECT COUNT(*) as available FROM assets WHERE status = 'Available'");
      const [[{ inMaintenance }]] = await conn.query("SELECT COUNT(*) as inMaintenance FROM assets WHERE status = 'Maintenance'");

      // 2. Get assets list with assigned user details
      const [assets] = await conn.query(`
        SELECT a.*, u.username as assigned_user_name, u.email as assigned_user_email
        FROM assets a
        LEFT JOIN users u ON a.assigned_user_id = u.id
        ORDER BY a.created_at DESC
      `);

      // 3. Get recent activities
      const [activities] = await conn.query(`
        SELECT aa.*, u.username as user_name
        FROM asset_activities aa
        LEFT JOIN users u ON aa.user_id = u.id
        ORDER BY aa.created_at DESC
        LIMIT 10
      `);

      res.json({
        stats: { totalAssets, inUse, available, inMaintenance },
        assets,
        activities
      });
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error fetching asset dashboard data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create new asset
exports.createAsset = async (req, res) => {
  try {
    const { asset_id, asset_name, description, category, serial_id, status, assigned_user_id } = req.body;
    let image_path = null;
    if (req.file) {
      image_path = req.file.path; // Multer saves the full path or relative path
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO assets (asset_id, asset_name, description, category, serial_id, status, assigned_user_id, image_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [asset_id || null, asset_name, description, category, serial_id, status || 'Available', assigned_user_id || null, image_path]
      );

      const newAssetId = result.insertId;

      // Log activity
      await conn.query(
        `INSERT INTO asset_activities (asset_id, user_id, action_type, description)
         VALUES (?, ?, 'Registered', ?)`,
        [newAssetId, req.user.userId, `Asset registered: ${asset_name}`]
      );

      await conn.commit();
      res.json({ message: "Asset created successfully", id: newAssetId });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error creating asset:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Asset ID must be unique" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update an asset
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { asset_id, asset_name, description, category, serial_id, status, assigned_user_id } = req.body;
    
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Check current state to log changes
      const [[currentAsset]] = await conn.query("SELECT * FROM assets WHERE id = ?", [id]);
      if (!currentAsset) {
        await conn.rollback();
        return res.status(404).json({ error: "Asset not found" });
      }

      let image_path = currentAsset.image_path;
      if (req.file) {
        image_path = req.file.path;
      }

      await conn.query(
        `UPDATE assets SET 
          asset_id = ?, asset_name = ?, description = ?, category = ?, 
          serial_id = ?, status = ?, assigned_user_id = ?, image_path = ?
         WHERE id = ?`,
        [asset_id || null, asset_name, description, category, serial_id, status, assigned_user_id || null, image_path, id]
      );

      // Log activity based on status change or general update
      let actionType = 'Updated';
      let logDesc = `Asset ${asset_name} details updated.`;

      if (currentAsset.status !== status && status === 'Maintenance') {
        actionType = 'Maintenance Logged';
        logDesc = `Asset reported for maintenance.`;
      } else if (currentAsset.assigned_user_id != assigned_user_id && assigned_user_id) {
        actionType = 'Reassigned';
        logDesc = `Asset assigned to new user.`;
      }

      await conn.query(
        `INSERT INTO asset_activities (asset_id, user_id, action_type, description)
         VALUES (?, ?, ?, ?)`,
        [id, req.user.userId, actionType, logDesc]
      );

      await conn.commit();
      res.json({ message: "Asset updated successfully" });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error("Error updating asset:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: "Asset ID must be unique" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete an asset
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM assets WHERE id = ?", [id]);
    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Error deleting asset:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
