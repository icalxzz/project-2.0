// db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",        // default XAMPP user
  password: "",        // default XAMPP password (kosong)
  database: "absensi" // sesuai database yang dibuat
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("✅ Connected to MySQL (XAMPP)");
});

export default db;
