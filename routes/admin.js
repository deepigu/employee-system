// routes/admin.js
require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET = process.env.SECRET_KEY;

// ----------------------------
// Middleware to check admin role
// ----------------------------
function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Not admin" });
    }

    // Save admin employee_id from token
    req.employeeId = decoded.employee_id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

// ----------------------------
// Admin dashboard
// ----------------------------
router.get("/dashboard", isAdmin, (req, res) => {
  res.json({
    message: "Admin access granted",
    employeeId: req.employeeId,
  });
});

// ----------------------------
// Get all logs
// ----------------------------
router.get("/logs", isAdmin, (req, res) => {
  db.all("SELECT * FROM time_logs ORDER BY timestamp DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// ----------------------------
// Daily report
// ----------------------------
router.get("/report/daily", isAdmin, (req, res) => {
  db.all(
    `SELECT employee_id,
            SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END) AS logins,
            SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) AS logouts
     FROM time_logs
     WHERE date(timestamp) = date('now')
     GROUP BY employee_id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

// ----------------------------
// Add employee (Admin only)
// - returns message + newly added employee details
// - checks duplicate employee_id/email
// ----------------------------
router.post("/add-employee", isAdmin, (req, res) => {
  const { employee_id, name, email, password, role } = req.body;

  if (!employee_id || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // 1) Check duplicates first (employee_id OR email)
  db.get(
    `SELECT employee_id, email FROM employees WHERE employee_id = ? OR email = ?`,
    [employee_id, email],
    (err, existing) => {
      if (err) return res.status(500).json({ message: err.message });

      if (existing) {
        return res.status(409).json({
          message:
            existing.employee_id === employee_id
              ? "Employee ID already exists"
              : "Email already exists",
        });
      }

      // 2) Insert new employee
      db.run(
        `INSERT INTO employees (employee_id, name, email, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        [employee_id, name, email, password, role],
        function (err2) {
          if (err2) return res.status(500).json({ message: err2.message });

          // 3) Return success + added employee (without password)
          return res.status(201).json({
            success: true,
            message: "✅ New employee added successfully",
            employee: {
              employee_id,
              name,
              email,
              role,
            },
          });
        }
      );
    }
  );
});

// ----------------------------
// Get all employees + total count (Admin only)
// - shows newest first (helps you check latest added)
// ----------------------------
router.get("/employees", isAdmin, (req, res) => {
  db.all(
    `SELECT employee_id, name, email, role
     FROM employees
     ORDER BY rowid DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });

      return res.json({
        success: true,
        totalEmployees: (rows || []).length,
        employees: rows || [],
      });
    }
  );
});

// ----------------------------
// (Optional) Get only latest N employees
// Example: /admin/employees/recent?limit=5
// ----------------------------
router.get("/employees/recent", isAdmin, (req, res) => {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit || "5", 10), 50));

  db.all(
    `SELECT employee_id, name, email, role
     FROM employees
     ORDER BY rowid DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });

      return res.json({
        success: true,
        limit,
        employees: rows || [],
      });
    }
  );
});

// ----------------------------
// Delete an employee by employee_id (Admin only)
// ----------------------------
router.delete("/employees/:employee_id", isAdmin, (req, res) => {
  const { employee_id } = req.params;

  // Prevent admin deleting themselves
  if (req.employeeId === employee_id) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  db.run(`DELETE FROM employees WHERE employee_id = ?`, [employee_id], function (err) {
    if (err) return res.status(500).json({ message: err.message });

    if (this.changes === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ success: true, message: "Employee deleted successfully" });
  });
});

module.exports = router;
