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
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const timeRoutes = require("./routes/time");

// ----------------------------
// Create Express server
// ----------------------------
const app = express();

// ----------------------------
// Middleware
// ----------------------------
app.use(cors({
  origin: [
    "https://employee-system-84mh.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
  ],
  credentials: true
}));

app.use(express.json());

// ----------------------------
// Serve static frontend files
// ----------------------------
const publicDir = path.join(__dirname, "public");

// ✅ This serves: /login.html, /style.css, /manifest.json, /icon-192.png, etc.
app.use(express.static(publicDir, { extensions: ["html"] }));

// ✅ Force correct files (helps fix manifest/icon issues)
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/login.html", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/admin.html", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));
app.get("/employee.html", (req, res) => res.sendFile(path.join(publicDir, "employee.html")));

// ✅ PWA files (explicit)
app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.sendFile(path.join(publicDir, "manifest.json"));
});

app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(path.join(publicDir, "sw.js"));
});

// ✅ Icons (explicit)
app.get("/icon-192.png", (req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.sendFile(path.join(publicDir, "icon-192.png"));
});

app.get("/icon-512.png", (req, res) => {
  res.setHeader("Content-Type", "image/png");
  res.sendFile(path.join(publicDir, "icon-512.png"));
});

// ----------------------------
// Register API routes
// ----------------------------
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/time", timeRoutes);

// ----------------------------
// 404 handler (optional but helpful)
// ----------------------------
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// ----------------------------
// Start server
// ----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
