
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./employee.db");

db.serialize(() => {
  // Employees table
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // Time logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER,
      action TEXT,
      timestamp TEXT
    )
  `);

  // Create default admin
  db.run(`
    INSERT OR IGNORE INTO employees (employee_id, name, email, password, role)
    VALUES (1, 'Admin', 'admin@gmail.com', '1234', 'admin')
  `);

  console.log("✅ Database & tables created");
});

db.close();
