const db = require("./db"); // your SQLite database connection

// Insert admin account
db.run(
  `INSERT INTO employees (employee_id, name, email, password, role)
   VALUES (?, ?, ?, ?, ?)`,
  ['ADMIN001', 'Admin User', 'admin@company.com', 'admin123', 'admin'],
  function(err) {
    if(err) {
      console.log("❌ Error:", err.message);
    } else {
      console.log("✅ Admin added successfully!");
    }
  }
);
