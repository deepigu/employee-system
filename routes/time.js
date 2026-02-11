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

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.employeeId = decoded.employee_id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }
}

// ----------------------------
// Clock In
// ----------------------------
router.post("/clock-in", authenticate, async (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'login', ?)",
    [req.employeeId, timestamp],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: "Clock-in successful", timestamp });
    }
  );
});

// Logout
router.post("/logout", authenticate, (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'logout', ?)",
    [req.employeeId, timestamp],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: "Logout successful", timestamp });
    }
  );
});

// Break Start
router.post("/break-start", authenticate, (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'break-start', ?)",
    [req.employeeId, timestamp],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: "Break started", timestamp });
    }
  );
});

// Break End
router.post("/break-end", authenticate, (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'break-end', ?)",
    [req.employeeId, timestamp],
    function (err) {
      if (err) return res.status(500).json({ message: err.message });

      res.json({ message: "Break ended", timestamp });
    }
  );
});

module.exports = router;
