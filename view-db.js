const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error("❌ Cannot open database:", err.message);
    return;
  }
  console.log("✅ Connected to SQLite database");
});

// Show all tables
db.all(
  "SELECT name FROM sqlite_master WHERE type='table';",
  [],
  (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("📦 Tables:", rows);

    // Show employees
    db.all("SELECT * FROM employees", [], (err, employees) => {
      if (err) {
        console.error("❌ Error reading employees:", err.message);
        return;
      }
      console.log("👤 Employees:", employees);
      db.close();
    });
  }
);
