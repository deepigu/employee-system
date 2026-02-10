const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.sqlite");

db.run(
  `INSERT INTO employees (employee_id, name, email, password, role)
   VALUES (?, ?, ?, ?, ?)`,
  ["EMP001", "Test Employee", "employee@test.com", "1234", "employee"],
  function (err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log("✅ Employee added successfully");
    }
    db.close();
  }
);
