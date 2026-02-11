const adminMiddleware = require("../middleware/adminMiddleware");
// routes/admin.js
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET = process.env.SECRET_KEY; // MUST match auth.js

// ----------------------------
// Admin Middleware
// ----------------------------
function adminMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // ✅ Check admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin only" });
    }

    // Attach admin info
    req.employee_id = decoded.employee_id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
}

// ----------------------------
// Admin Dashboard Test
// ----------------------------
router.get("/dashboard", adminMiddleware, (req, res) => {
  res.json({
    message: "Admin access granted",
    admin_id: req.employee_id
  });
});

// ----------------------------
// Get all employee logs
// ----------------------------
router.get("/logs", adminMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM time_logs ORDER BY timestamp DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(rows);
    }
  );
});

// ----------------------------
// Daily report
// ----------------------------
router.get("/report/daily", adminMiddleware, (req, res) => {
  db.all(
    `
    SELECT employee_id,
           SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) AS logins,
           SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) AS logouts
    FROM time_logs
    WHERE date(timestamp) = date('now')
    GROUP BY employee_id
    `,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      res.json(rows);
    }
  );
});

// ----------------------------
// Add employee (Admin only)
// ----------------------------
router.post("/add-employee", adminMiddleware, (req, res) => {
  const { employee_id, name, email, password, role } = req.body;

  if (!employee_id || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  db.run(
    `
    INSERT INTO employees (employee_id, name, email, password, role)
    VALUES (?, ?, ?, ?, ?)
    `,
    [employee_id, name, email, password, role],
    function (err) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      res.json({
        message: "Employee added successfully",
        employee_id,
        name,
        email,
        role
      });
    }
  );
});

module.exports = router;

