// routes/time.js
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("../db"); // Your SQLite database

const router = express.Router();
const SECRET = "SECRET_KEY";

// Middleware to verify token
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.employeeId = decoded.employee_id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
}

// ----------------------------
// Logout
// ----------------------------
router.post("/logout", authenticate, async (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'logout', ?)",
    [req.employeeId, timestamp],
    async (err) => {
      if (err) return res.status(500).json({ message: err.message });

      try {
        await axios.post(
          "https://employee-system-84mh.onrender.com",
          { employee_id: req.employeeId, action: "logout", timestamp }
        );
      } catch (e) {
        console.log("⚠️ n8n webhook failed, logout recorded anyway");
      }

      res.json({ message: "Logout successful", timestamp });
    }
  );
});

// ----------------------------
// Break Start
// ----------------------------
router.post("/break-start", authenticate, async (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'break-start', ?)",
    [req.employeeId, timestamp],
    async (err) => {
      if (err) return res.status(500).json({ message: err.message });

      try {
        await axios.post(
          "https://employee-system-84mh.onrender.com",
          { employee_id: req.employeeId, action: "break-start", timestamp }
        );
      } catch (e) {
        console.log("⚠️ n8n webhook failed, break-start recorded anyway");
      }

      res.json({ message: "Break started", timestamp });
    }
  );
});

// ----------------------------
// Break End
// ----------------------------
router.post("/break-end", authenticate, async (req, res) => {
  const timestamp = new Date().toISOString();

  db.run(
    "INSERT INTO time_logs (employee_id, action, timestamp) VALUES (?, 'break-end', ?)",
    [req.employeeId, timestamp],
    async (err) => {
      if (err) return res.status(500).json({ message: err.message });

      try {
        await axios.post(
          "https://deepika27.app.n8n.cloud/webhook/employee-time-event",
          { employee_id: req.employeeId, action: "break-end", timestamp }
        );
      } catch (e) {
        console.log("⚠️ n8n webhook failed, break-end recorded anyway");
      }

      res.json({ message: "Break ended", timestamp });
    }
  );
});

module.exports = router;
