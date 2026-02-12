// ----------------------------
// Import required packages
// ----------------------------
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ----------------------------
// Import route files
// ----------------------------
const authRoutes = require("./routes/auth");     // Login route
const adminRoutes = require("./routes/admin");   // Admin routes
const timeRoutes = require("./routes/time");     // Break/Logout routes

// ----------------------------
// Create Express server
// ----------------------------
const app = express();

// ----------------------------
// Middleware
// ----------------------------
// Enable CORS for your frontend domain
app.use(cors({
  origin: "https://employee-system-84mh.onrender.com", // replace with your Render frontend URL
  credentials: true
}));

app.use(express.json());   // Parse JSON in POST body

// ----------------------------
// Serve static frontend files
// ----------------------------
app.use(express.static(path.join(__dirname, "public"))); // put HTML/CSS/JS inside "public" folder

// Serve login, admin, and employee pages
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/admin.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get("/employee.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "employee.html"));
});

// ----------------------------
// Register API routes
// ----------------------------
app.use("/api/auth", authRoutes);     // Login: POST /api/auth/login
app.use("/api/admin", adminRoutes);   // Admin routes
app.use("/api/time", timeRoutes);     // Employee break/logout routes

// ----------------------------
// Start server
// ----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
