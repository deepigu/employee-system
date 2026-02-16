// routes/auth.js
require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../db"); // SQLite DB connection

const router = express.Router();
const SECRET = process.env.SECRET_KEY || "my-secret-key"; // fallback if .env not set

// ----------------------------
// Employee/Admin Login
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    db.get("SELECT * FROM employees WHERE email = ?", [email], async (err, user) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (!user) return res.status(401).json({ message: "Invalid email" });
      if (user.password !== password) return res.status(401).json({ message: "Wrong password" });

      const token = jwt.sign(
        { employee_id: user.employee_id, role: user.role },
        SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        token,
        role: user.role,
        employee_id: user.employee_id,
        name: user.name
      });
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------------
// ✅ NEW: Change Password (Employee/Admin - self)
// POST /api/auth/change-password
// Body: { oldPassword, newPassword }
// ----------------------------
router.post("/change-password", (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized - No token" });
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized - Invalid token" });
  }

  const employee_id = decoded.employee_id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Old password and new password are required" });
  }

  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  db.get(
    "SELECT password FROM employees WHERE employee_id = ?",
    [employee_id],
    (err, row) => {
      if (err) return res.status(500).json({ message: err.message });
      if (!row) return res.status(404).json({ message: "Employee not found" });

      if (row.password !== oldPassword) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      db.run(
        "UPDATE employees SET password = ? WHERE employee_id = ?",
        [newPassword, employee_id],
        function (err2) {
          if (err2) return res.status(500).json({ message: err2.message });

          return res.json({
            success: true,
            message: "✅ Password updated successfully"
          });
        }
      );
    }
  );
});

module.exports = router;
