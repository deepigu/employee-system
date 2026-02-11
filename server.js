require("dotenv").config(); // ✅ load .env
// server.js

// ----------------------------
// Import required packages
// ----------------------------
const express = require("express");


const cors = require("cors");
app.use(cors({original: " https://employee-system-84mh.onrender.com"})

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
app.use(cors());           // Allow cross-origin requests
app.use(express.json());   // Parse JSON in POST body
// server.js
const path = require("path");

//✅ ADD THIS - Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Root route - redirect to login
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/login.html"));
});

// ----------------------------
// Register routes
// ----------------------------
app.use("/api/auth", authRoutes);     // Login: POST /api/auth/login
app.use("/api/admin", adminRoutes);   // Admin routes
app.use("/api/time", timeRoutes);     // Employee break/logout routes

// ----------------------------
// Start server
// ----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





