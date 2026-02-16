// routes/admin.js
require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET = process.env.SECRET_KEY;

function isAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized - No token" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden - Not admin" });
    }
    req.employeeId = decoded.employee_id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

router.get("/dashboard", isAdmin, (req, res) => {
  res.json({ message: "Admin access granted", employeeId: req.employeeId });
});

router.get("/logs", isAdmin, (req, res) => {
  db.all("SELECT * FROM time_logs ORDER BY timestamp DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows || []);
  });
});

// ✅ Daily report (timezone-safe)
router.get("/report/daily", isAdmin, (req, res) => {
  db.all(
    `SELECT employee_id,
            SUM(CASE WHEN action = 'login' THEN 1 ELSE 0 END)  AS logins,
            SUM(CASE WHEN action = 'logout' THEN 1 ELSE 0 END) AS logouts
     FROM time_logs
     WHERE date(timestamp, 'localtime') = date('now', 'localtime')
     GROUP BY employee_id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows || []);
    }
  );
});

// ✅ Today stats includes Idle Now
router.get("/stats/today", isAdmin, (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM employees) AS totalEmployees,

      (SELECT COUNT(*) FROM time_logs
        WHERE action='login'
          AND date(timestamp, 'localtime') = date('now','localtime')
      ) AS todayLogins,

      (SELECT COUNT(*) FROM time_logs
        WHERE action='logout'
          AND date(timestamp, 'localtime') = date('now','localtime')
      ) AS todayLogouts,

      (SELECT COUNT(*) FROM (
          SELECT employee_id, action
          FROM time_logs
          WHERE rowid IN (SELECT MAX(rowid) FROM time_logs GROUP BY employee_id)
        ) last
        WHERE last.action = 'break-start'
      ) AS onBreakNow,

      (SELECT COUNT(*) FROM (
          SELECT employee_id, action
          FROM time_logs
          WHERE rowid IN (SELECT MAX(rowid) FROM time_logs GROUP BY employee_id)
        ) last2
        WHERE last2.action LIKE 'idle-%'
      ) AS idleNow
  `;

  db.get(sql, [], (err, row) => {
    if (err) return res.status(500).json({ message: err.message });

    res.json({
      success: true,
      totalEmployees: row?.totalEmployees || 0,
      todayLogins: row?.todayLogins || 0,
      todayLogouts: row?.todayLogouts || 0,
      onBreakNow: row?.onBreakNow || 0,
      idleNow: row?.idleNow || 0,
    });
  });
});

// ✅ Live status supports Idle + Resume
router.get("/live-status", isAdmin, (req, res) => {
  const sql = `
    SELECT e.employee_id, e.name, e.email, e.role,
           COALESCE(last.action, 'none') AS last_action,
           COALESCE(last.timestamp, '') AS last_timestamp
    FROM employees e
    LEFT JOIN (
      SELECT t1.employee_id, t1.action, t1.timestamp
      FROM time_logs t1
      WHERE t1.rowid IN (SELECT MAX(rowid) FROM time_logs GROUP BY employee_id)
    ) last
    ON last.employee_id = e.employee_id
    ORDER BY e.employee_id ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });

    const list = (rows || []).map((r) => {
      let status = "Never Logged In";

      if (r.last_action === "login") status = "Working";
      else if (r.last_action === "break-start") status = "On Break";
      else if (r.last_action === "break-end") status = "Working";
      else if (r.last_action === "resume") status = "Working";
      else if (r.last_action === "logout") status = "Logged Out";
      else if ((r.last_action || "").startsWith("idle-")) status = "Idle";

      return {
        employee_id: r.employee_id,
        name: r.name,
        email: r.email,
        role: r.role,
        status,
        last_action: r.last_action,
        last_timestamp: r.last_timestamp,
      };
    });

    res.json({ success: true, employees: list });
  });
});

// Add employee
router.post("/add-employee", isAdmin, (req, res) => {
  const { employee_id, name, email, password, role } = req.body;

  if (!employee_id || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

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

      db.run(
        `INSERT INTO employees (employee_id, name, email, password, role)
         VALUES (?, ?, ?, ?, ?)`,
        [employee_id, name, email, password, role],
        function (err2) {
          if (err2) return res.status(500).json({ message: err2.message });

          return res.status(201).json({
            success: true,
            message: "✅ New employee added successfully",
            employee: { employee_id, name, email, role },
          });
        }
      );
    }
  );
});

// Employees list
router.get("/employees", isAdmin, (req, res) => {
  db.all(
    `SELECT employee_id, name, email, role
     FROM employees
     ORDER BY rowid DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        success: true,
        totalEmployees: (rows || []).length,
        employees: rows || [],
      });
    }
  );
});

// Delete employee
router.delete("/employees/:employee_id", isAdmin, (req, res) => {
  const { employee_id } = req.params;

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
