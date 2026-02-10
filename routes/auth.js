// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const db = require("../db"); // your SQLite db connection

const router = express.Router();
const SECRET = process.env.SECRET_KEY; // you can move this to .env

// ----------------------------
// Employee Login
// ----------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Get employee from DB
    db.get(
      "SELECT * FROM employees WHERE email = ?",
      [email],
      async (err, user) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (!user) return res.status(401).json({ message: "Invalid email" });
        if (user.password !== password) return res.status(401).json({ message: "Wrong password" });

        // Create JWT token
        const token = jwt.sign(
          { employee_id: user.employee_id, role: user.role },
          SECRET,
          { expiresIn: "8h" }
        );

        // Try sending to n8n webhook (optional)
        try {
          await axios.post(
            "https://employee-system-84mh.onrender.com",
            {
              employee_id: user.employee_id,
              action: "login",
              timestamp: new Date().toISOString(),
              employee_name: user.name,
              employee_email: user.email
            }
          );
        } catch (e) {
          console.log("⚠️ n8n webhook failed, login allowed");
        }

        // ✅ Send token, role, employee_id, and name back
        res.json({
          token,
          role: user.role,
          employee_id: user.employee_id,
          name: user.name // <-- Added employee name here
        });
      }
    );
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
