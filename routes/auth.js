// routes/auth.js
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

    // Get employee from DB
    db.get("SELECT * FROM employees WHERE email = ?", [email], async (err, user) => {
      if (err) return res.status(500).json({ message: "Database error" });
      if (!user) return res.status(401).json({ message: "Invalid email" });
      if (user.password !== password) return res.status(401).json({ message: "Wrong password" });

      // Create JWT token
      const token = jwt.sign(
        { employee_id: user.employee_id, role: user.role },
        SECRET,
        { expiresIn: "8h" }
      );

      // Send token + role + employee info
      res.json({
        token,
        role: user.role,        // 🔥 admin or employee
        employee_id: user.employee_id,
        name: user.name
      });
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
