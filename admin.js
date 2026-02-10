const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// Middleware to check admin role
function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    if (decoded.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    req.employeeId = decoded.employeeId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// Get all employee logs
router.get("/logs", isAdmin, (req, res) => {
  db.all(`SELECT * FROM time_logs ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Calculate daily hours per employee
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
      res.json(rows);
    }
  );
});


// Add a new employee (Admin only)
router.post("/add-employee", isAdmin, (req, res) => {
  const { employee_id, name, email, password, role } = req.body;

  // Validate required fields
  if (!employee_id || !name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Insert into employees table
  db.run(
    `INSERT INTO employees (employee_id, name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [employee_id, name, email, password, role],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({
        message: "Employee added successfully",
        id: this.lastID,
        employee_id,
        name,
        email,
        role,
      });
    }
  );
});


module.exports = router;
