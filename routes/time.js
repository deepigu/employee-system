// routes/time.js
require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const SECRET = process.env.SECRET_KEY;

// Middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized - No token" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    req.employeeId = decoded.employee_id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

// ✅ helper to insert with SQLite local time
function insertLog(employeeId, action, res, successMessage) {
  db.run(
    `INSERT INTO time_logs (employee_id, action, timestamp)
     VALUES (?, ?, datetime('now','localtime'))`,
    [employeeId, action],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });

      // Return also "server time" for testing
      db.get(`SELECT datetime('now','localtime') AS serverTime`, [], (e2, row) => {
        return res.json({
          message: successMessage,
          serverTime: row?.serverTime || ""
        });
      });
    }
  );
}

// Clock In
router.post("/clock-in", authenticate, (req, res) => {
  insertLog(req.employeeId, "login", res, "Clock-in successful");
});

// Logout
router.post("/logout", authenticate, (req, res) => {
  insertLog(req.employeeId, "logout", res, "Logout successful");
});

// Break Start
router.post("/break-start", authenticate, (req, res) => {
  insertLog(req.employeeId, "break-start", res, "Break started");
});

// Break End
router.post("/break-end", authenticate, (req, res) => {
  insertLog(req.employeeId, "break-end", res, "Break ended");
});

module.exports = router;
