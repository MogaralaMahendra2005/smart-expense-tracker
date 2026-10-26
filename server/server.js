
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./database");

const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = require("./firebase-service-account.json");

initializeApp({
  credential: cert(serviceAccount),
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Add user_id without deleting existing transactions.
const columns = db.prepare("PRAGMA table_info(transactions)").all();

if (!columns.some((column) => column.name === "user_id")) {
  db.exec("ALTER TABLE transactions ADD COLUMN user_id TEXT");
  console.log("Added user_id column to transactions.");
}

// Verify the Firebase ID token.
async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.split(" ")[1];
    req.user = await getAuth().verifyIdToken(token);

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

// Public backend health check.
app.get("/", (req, res) => {
  res.json({
    message: "Smart Expense Tracker backend is running!",
  });
});

// Get only the signed-in user's transactions.
app.get("/api/transactions", verifyFirebaseToken, (req, res) => {
  const transactions = db
    .prepare(
      `SELECT * FROM transactions
       WHERE user_id = ?
       ORDER BY date DESC, id DESC`
    )
    .all(req.user.uid);

  res.json(transactions);
});

// Add a transaction for the signed-in user.
app.post("/api/transactions", verifyFirebaseToken, (req, res) => {
  const { description, amount, type, date, category } = req.body;

  if (
    typeof description !== "string" ||
    !description.trim() ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !["income", "expense"].includes(type) ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof category !== "string" ||
    !category.trim()
  ) {
    return res.status(400).json({
      error: "Please provide valid transaction details.",
    });
  }

  const result = db
    .prepare(
      `INSERT INTO transactions
       (description, amount, type, date, category, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      description.trim(),
      amount,
      type,
      date,
      category.trim(),
      req.user.uid
    );

  const transaction = db
    .prepare(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ?"
    )
    .get(result.lastInsertRowid, req.user.uid);

  res.status(201).json(transaction);
});
console.log("PUT update route registered");
// Update a transaction owned by the signed-in user.
app.put("/api/transactions/:id", verifyFirebaseToken, (req, res) => {
  const id = Number(req.params.id);
  const { description, amount, type, date, category } = req.body;

  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    typeof description !== "string" ||
    !description.trim() ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !["income", "expense"].includes(type) ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof category !== "string" ||
    !category.trim()
  ) {
    return res.status(400).json({
      error: "Please provide valid transaction details.",
    });
  }

  const result = db
    .prepare(
      `UPDATE transactions
       SET description = ?,
           amount = ?,
           type = ?,
           date = ?,
           category = ?
       WHERE id = ? AND user_id = ?`
    )
    .run(
      description.trim(),
      amount,
      type,
      date,
      category.trim(),
      id,
      req.user.uid
    );

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Transaction not found.",
    });
  }

  const transaction = db
    .prepare(
      "SELECT * FROM transactions WHERE id = ? AND user_id = ?"
    )
    .get(id, req.user.uid);

  res.json(transaction);
});

// Delete only a transaction owned by the signed-in user.
app.delete("/api/transactions/:id", verifyFirebaseToken, (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Invalid transaction ID.",
    });
  }

  const result = db
    .prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?")
    .run(id, req.user.uid);

  if (result.changes === 0) {
    return res.status(404).json({
      error: "Transaction not found.",
    });
  }

  res.json({
    message: "Transaction deleted successfully.",
  });
});

app.listen(PORT, () => {
  console.log("Firebase Admin connected successfully!");
  console.log("SQLite database connected successfully!");
  console.log(`Server running at http://localhost:${PORT}`);
});
