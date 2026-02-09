// server.js

// ----------------------------
// Import required packages
// ----------------------------
const express = require("express");
const cors = require("cors");

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

// ----------------------------
// Register routes
// ----------------------------
app.use("/api/auth", authRoutes);     // Login: POST /api/auth/login
app.use("/api/admin", adminRoutes);   // Admin routes
app.use("/api/time", timeRoutes);     // Employee break/logout routes

// ----------------------------
// Start server
// ----------------------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
