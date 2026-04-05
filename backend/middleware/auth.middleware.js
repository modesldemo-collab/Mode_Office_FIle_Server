/**
 * middleware/auth.middleware.js
 * JWT verification + role guard helpers
 */

const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/constants");

/**
 * authenticate — verifies JWT from Authorization header or ?token= query param.
 * Attaches decoded payload to req.user on success.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(" ")[1] : req.query.token;

  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * adminOnly — must be used AFTER authenticate.
 * Rejects non-admin callers with 403.
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ error: "Admin access required" });
  next();
};

module.exports = { authenticate, adminOnly };
