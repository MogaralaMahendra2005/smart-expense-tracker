
const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "expenses.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    date TEXT NOT NULL,
    category TEXT NOT NULL
  )
`);

console.log("SQLite database connected successfully!");

module.exports = db;
