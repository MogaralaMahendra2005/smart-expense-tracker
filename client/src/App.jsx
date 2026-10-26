import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";

import { auth, googleProvider } from "./firebase";
import "./App.css";
import LandingPage from "./LandingPage";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You are not logged in.");
  }

  const token = await user.getIdToken();

  config.headers = config.headers || {};
  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

// Your existing code above...

function categorize(description = "") {
  const text = description.toLowerCase().trim();

  if (!text) return "Other";

  if (/grocery|groceries|supermarket|vegetable|milk|rice|provision|fruit|eggs?|bread|soap|shampoo|detergent|toothpaste/.test(text))
    return "Groceries";

  if (/restaurant|swiggy|zomato|pizza|cafe|coffee|food|lunch|dinner|breakfast|snack|biryani|hotel/.test(text))
    return "Food";

  if (/uber|ola|petrol|fuel|bus|train|metro|rapido|auto|taxi|ticket|travel|transport/.test(text))
    return "Transport";

  if (/amazon|flipkart|shopping|clothing|fashion|shoe|shirt|jeans|dress|bag|watch/.test(text))
    return "Shopping";

  if (/electricity|water bill|internet|recharge|mobile bill|phone bill|broadband|gas bill/.test(text))
    return "Bills";

  if (/netflix|spotify|subscription|prime video|hotstar|youtube premium/.test(text))
    return "Subscriptions";

  if (/college|course|book|education|exam|tuition|school|fees|stationery|notebook|pen/.test(text))
    return "Education";

  return "Other";
}

// Parse CSV rows, including quoted fields and commas inside quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (insideQuotes && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      row.push(field.trim());
      field = "";
    } else if (
      (char === "\n" || char === "\r") &&
      !insideQuotes
    ) {
      if (char === "\r" && text[i + 1] === "\n") i++;

      row.push(field.trim());

      if (row.some((cell) => cell !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.trim());

  if (row.some((cell) => cell !== "")) {
    rows.push(row);
  }

  if (insideQuotes) {
    throw new Error("The CSV contains an unclosed quotation mark.");
  }

  return rows;
}

function parseCSVDate(rawDate) {
  if (!rawDate) {
    return new Date().toLocaleDateString("en-CA");
  }

  const value = rawDate.trim();

  // Preserve ISO dates without timezone conversion.
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // Support common DD/MM/YYYY and DD-MM-YYYY dates.
  const localMatch = value.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (localMatch) {
    const day = Number(localMatch[1]);
    const month = Number(localMatch[2]);
    const year = Number(localMatch[3]);

    const parsed = new Date(year, month - 1, day);

    if (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    ) {
      return [
        year,
        String(month).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-");
    }

    return null;
  }

  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  const parsed = new Date(timestamp);

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseMoney(raw) {
  const cleaned = String(raw ?? "")
    .trim()
    .replace(/[₹$€£,\s]/g, "");

  if (!cleaned) return 0;

  const parenthesized = /^\(.*\)$/.test(cleaned);
  const normalized = cleaned.replace(/[()]/g, "");

  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return NaN;
  }

  const value = Number(normalized);

  if (!Number.isFinite(value)) return NaN;

  return parenthesized ? -Math.abs(value) : value;
}

function App() {
    const [message, setMessage] = useState("");
    const [activePage, setActivePage] = useState("Dashboard");
  useEffect(() => {
  if (!message) return;

  const timer = setTimeout(() => {
    setMessage("");
  }, 5000);

  return () => clearTimeout(timer);
}, [message]);
    const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
function formatTransactionDay(dateString) {
  if (!dateString) return "Date not available";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showLanding, setShowLanding] = useState(true);

  const [transactions, setTransactions] = useState([]);
const [darkMode, setDarkMode] = useState(() => {
  return localStorage.getItem("expenseTrackerTheme") === "dark";
});

  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  
const [budgets, setBudgets] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("expenseTrackerBudgets")) || {};
  } catch {
    return {};
  }
});

useEffect(() => {
  localStorage.setItem(
    "expenseTrackerTheme",
    darkMode ? "dark" : "light"
  );
}, [darkMode]);

  
  const budgetCategories = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Education",
  "Other",
];

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [type, setType] = useState("expense");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  async function loadTransactions() {
    try {
      const response = await api.get("/transactions");

      setTransactions(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Load transactions error:", error);
      setMessage(
        "Could not load transactions. Check your login and backend."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setLoading(true);
      loadTransactions();
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user, authLoading]);

 const filteredTransactions = transactions.filter((item) => {
  if (!item.date) return false;
  return String(item.date).slice(0, 7) === selectedMonth;
});
const totalIncome = filteredTransactions
  .filter((item) => item.type?.toLowerCase() === "income")
  .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

const totalExpenses = filteredTransactions
  .filter((item) => item.type?.toLowerCase() === "expense")
  .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

const remainingBalance = totalIncome - totalExpenses;

const highestSpendingCategory = Object.entries(
  filteredTransactions
    .filter((item) => item.type?.toLowerCase() === "expense")
    .reduce((totals, item) => {
      const category = item.category || "Other";
      totals[category] =
        (totals[category] || 0) + (Number(item.amount) || 0);
      return totals;
    }, {})
).sort((a, b) => b[1] - a[1])[0];

const budgetWarnings = Object.entries(
  filteredTransactions
    .filter((item) => item.type?.toLowerCase() === "expense")
    .reduce((totals, item) => {
      const category = item.category || "Other";
      totals[category] =
        (totals[category] || 0) + (Number(item.amount) || 0);
      return totals;
    }, {})
).filter(([category, spent]) => {
  const budget = Number(budgets[category]) || 0;
  return budget > 0 && spent >= budget * 0.8;
});


const exportToCSV = () => {
  const headers = [
    "Description",
    "Amount",
    "Type",
    "Category",
    "Date",
  ];

  const rows = filteredTransactions.map((item) => [
    item.description,
    item.amount,
    item.type,
    item.category,
    item.date,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `expenses-${selectedMonth}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

const exportToPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("Smart Expense Tracker", 14, 20);

  doc.setFontSize(11);
  doc.text(`Monthly Expense Report: ${selectedMonth}`, 14, 30);
  doc.text(`Total Income: ${money(totalIncome)}`, 14, 38);
  doc.text(`Total Expenses: ${money(totalExpenses)}`, 14, 46);
  doc.text(`Remaining Balance: ${money(remainingBalance)}`, 14, 54);

  autoTable(doc, {
    startY: 64,
    head: [["Description", "Amount (INR)", "Type", "Category", "Date"]],
    body: filteredTransactions.map((item) => [
      item.description || "",
      Number(item.amount || 0).toFixed(2),
      item.type || "",
      item.category || "",
      item.date || "",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 64, 175] },
  });

  doc.save(`expense-report-${selectedMonth}.pdf`);
};

const savingsRate =
  totalIncome > 0
    ? ((remainingBalance / totalIncome) * 100).toFixed(1)
    : "0.0";
  
const expenseByCategory = Object.values(
  filteredTransactions
    .filter(
      (transaction) =>
        transaction.type?.toLowerCase() === "expense" &&
        transaction.category?.toLowerCase() !== "budget"
    )
    .reduce((categories, transaction) => {
      const name =
        transaction.category ||
        categorize(transaction.description);

      if (!categories[name]) {
        categories[name] = { name, value: 0 };
      }

      categories[name].value += Number(transaction.amount) || 0;

      return categories;
    }, {})
);

const monthlySpending = Object.values(
  transactions.reduce((months, transaction) => {
    if (transaction.type?.toLowerCase() !== "expense") {
      return months;
    }

    const month = String(transaction.date || "").slice(0, 7);
    if (!month) return months;

    if (!months[month]) {
      months[month] = { month, expenses: 0 };
    }

    months[month].expenses += Number(transaction.amount) || 0;
    return months;
  }, {})
).sort((a, b) => a.month.localeCompare(b.month));

const budgetSpending = budgetCategories.map((category) => {
  const spent = filteredTransactions
    .filter(
      (transaction) =>
        transaction.type?.toLowerCase() === "expense" &&
        (transaction.category ||
          categorize(transaction.description)) === category
    )
    .reduce(
      (total, transaction) => total + (Number(transaction.amount) || 0),
      0
    );

  return {
    category,
    spent,
    budget: Number(budgets[category]) || 0,
    remaining: (Number(budgets[category]) || 0) - spent,
  };
});


const income = filteredTransactions
  .filter((item) => item.type?.toLowerCase() === "income")
  .reduce((total, item) => total + Number(item.amount || 0), 0);

const expenses = filteredTransactions
  .filter((item) => item.type?.toLowerCase() === "expense")
  .reduce((total, item) => total + Number(item.amount || 0), 0);



  async function handleEmailAuth(event) {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleLogin() {
    setAuthError("");
    setAuthBusy(true);

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function addTransaction(event) {
    event.preventDefault();
    setMessage("");

    const value = Number(amount);

    if (
      !description.trim() ||
      !Number.isFinite(value) ||
      value <= 0 ||
      !date
    ) {
      setMessage("Enter a description, valid amount, and date.");
      return;
    }

    const transaction = {
      description: description.trim(),
      amount: value,
      type,
      date,
      category:
        type === "income"
          ? "Income"
          : category.trim() || categorize(description),
    };

    setSaving(true);

    try {
      if (editingId !== null) {
        const response = await api.put(
          `/transactions/${editingId}`,
          transaction
        );

        setTransactions((previous) =>
          previous.map((item) =>
            item.id === editingId ? response.data : item
          )
        );

        setMessage("Transaction updated successfully!");
        setEditingId(null);
        setTimeout(() => {
  setMessage("");
}, 2500);
      } else {
        const response = await api.post(
          "/transactions",
          transaction
        );

        setTransactions((previous) => [
          response.data,
          ...previous,
        ]);

        setMessage("Transaction saved successfully!");
        setTimeout(() => {
  setMessage("");
}, 2500);
      }

      setDescription("");
      setAmount("");
      setCategory("Other");
    } catch (error) {
      console.error("Save transaction error:", error);

      setMessage(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Could not save transaction."
      );
    } finally {
      setSaving(false);
    }
  }

  // Step 9: Read, validate, and import a bank statement CSV.
  async function importCSV(event) {
    const input = event.target;
    const file = input.files?.[0];

    if (!file) return;

    setMessage("");
    setImporting(true);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Please select a CSV file.");
      }

      const text = (await file.text()).replace(/^\uFEFF/, "");
      const rows = parseCSV(text);

      if (rows.length < 2) {
        throw new Error("The CSV file has no transaction rows.");
      }

      const headers = rows[0].map((header) =>
        header.toLowerCase().replace(/[\s_-]/g, "")
      );

      const findColumn = (...names) =>
        headers.findIndex((header) => names.includes(header));

      const dateCol = findColumn(
        "date",
        "transactiondate",
        "valuedate",
        "postingdate"
      );

      const descCol = findColumn(
        "description",
        "merchant",
        "details",
        "narration",
        "name",
        "particulars",
        "transactiondetails"
      );

      const amountCol = findColumn(
        "amount",
        "transactionamount",
        "transactionvalue"
      );

      const debitCol = findColumn(
        "debit",
        "withdrawal",
        "withdrawals",
        "debitamount"
      );

      const creditCol = findColumn(
        "credit",
        "deposit",
        "deposits",
        "creditamount"
      );

      if (
        descCol < 0 ||
        (amountCol < 0 && debitCol < 0 && creditCol < 0)
      ) {
        throw new Error(
          "CSV needs Description and Amount, or Description with Debit/Credit columns."
        );
      }

      const imported = [];
      let skipped = 0;

      for (const cells of rows.slice(1)) {
        const descriptionValue = (cells[descCol] || "").trim();

        if (!descriptionValue) {
          skipped++;
          continue;
        }

        let value;
        let transactionType;

        if (debitCol >= 0 || creditCol >= 0) {
          const debit =
            debitCol >= 0 ? parseMoney(cells[debitCol]) : 0;
          const credit =
            creditCol >= 0 ? parseMoney(cells[creditCol]) : 0;

          if (
            !Number.isFinite(debit) ||
            !Number.isFinite(credit) ||
            debit < 0 ||
            credit < 0
          ) {
            skipped++;
            continue;
          }

          if (debit > 0 && credit === 0) {
            value = debit;
            transactionType = "expense";
          } else if (credit > 0 && debit === 0) {
            value = credit;
            transactionType = "income";
          } else {
            // Skip empty rows and rows where both debit and credit
            // contain amounts, because their meaning is ambiguous.
            skipped++;
            continue;
          }
        } else {
          const raw = parseMoney(cells[amountCol]);

          if (!Number.isFinite(raw) || raw === 0) {
            skipped++;
            continue;
          }

          value = Math.abs(raw);
          transactionType = raw < 0 ? "expense" : "income";
        }

        if (!Number.isFinite(value) || value <= 0) {
          skipped++;
          continue;
        }

        const parsedDate = parseCSVDate(
          dateCol >= 0 ? cells[dateCol] : ""
        );

        if (!parsedDate) {
          skipped++;
          continue;
        }

        imported.push({
          description: descriptionValue,
          amount: Math.round(value * 100) / 100,
          type: transactionType,
          date: parsedDate,
          category:
            transactionType === "income"
              ? "Income"
              : categorize(descriptionValue),
        });
      }

      if (imported.length === 0) {
        setMessage(
          `No valid transactions found. Skipped ${skipped} rows.`
        );
        return;
      }

      // Skip exact matches against transactions already loaded and
      // against earlier rows in this same CSV.
      const makeKey = (transaction) =>
        [
          transaction.description.trim().toLowerCase(),
          Number(transaction.amount).toFixed(2),
          transaction.type.toLowerCase(),
          transaction.date,
        ].join("|");

      const knownKeys = new Set(
        transactions.map(makeKey)
      );

      const uniqueImported = [];

      for (const transaction of imported) {
        const key = makeKey(transaction);

        if (knownKeys.has(key)) {
          skipped++;
          continue;
        }

        knownKeys.add(key);
        uniqueImported.push(transaction);
      }


      let saved = 0;
      let failed = 0;
      const errors = [];

      for (const transaction of uniqueImported) {
        try {
          // Use the authenticated API client, not bare axios.
          await api.post("/transactions", transaction);
          saved++;
        } catch (error) {
          failed++;
          console.error(
            "Could not import transaction:",
            transaction.description,
            error.response?.data || error.message
          );

          // Keep failed rows eligible for retry if the failure was
          // caused by a duplicate in this import attempt.
          knownKeys.delete(makeKey(transaction));

          if (errors.length < 2) {
            errors.push(
              error.response?.data?.message ||
                error.response?.data?.error ||
                error.message
            );
          }
        }
      }

      if (saved > 0) {
        await loadTransactions();
      }

      if (failed === 0) {
    setMessage(
  `Import complete! Saved ${saved} transactions. Skipped ${skipped} rows.`
);

setTimeout(() => {
  setMessage("");
}, 2000);
      } else {
        setMessage(
          `Import finished: saved ${saved}, failed ${failed}, skipped ${skipped}. ${errors.join(" ")}`
        );
      }
    } catch (error) {
      console.error("CSV import error:", error);
      setMessage(error.message || "Unable to import the CSV file.");
    } finally {
      setImporting(false);
      input.value = "";
    }
  }

async function deleteTransaction(id) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this transaction?"
  );

  if (!confirmed) {
    return;
  }

  setMessage("");

  try {
    await api.delete(`/transactions/${id}`);

    setTransactions((previous) =>
      previous.filter((item) => item.id !== id)
    );

    if (editingId === id) {
      setEditingId(null);
      setDescription("");
      setAmount("");
    }

    setMessage("Transaction deleted successfully!");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  } catch (error) {
    console.error("Delete transaction error:", error);

    setMessage(
      error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Could not delete transaction."
    );
  }
}

 
    function formatTransactionDay(dateString) {
  if (!dateString) return "Date not available";

  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
const money =(value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  if (authLoading) {
    return <p>Loading...</p>;
  }

  if (showLanding) {
    return (
      <LandingPage
        onGetStarted={() => {
          setShowLanding(false);
        }}
      />
    );
  }

  if (!user) {
    return (
      <div className="auth-container">
        <h1>Smart Expense Tracker</h1>
        <h2>{isLogin ? "Welcome Back" : "Create Account"}</h2>

        <form onSubmit={handleEmailAuth}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (at least 6 characters)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={6}
            required
          />

          <button type="submit" disabled={authBusy}>
            {authBusy
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={authBusy}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
              transform="translate(0 4)"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.65 5.94c4.47-4.13 7.12-10.2 7.12-17.59Z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
              transform="translate(0 4)"
            />
            <path
              fill="#34A853"
              d="M24 48c6.47 0 11.9-2.13 15.86-5.86l-7.65-5.94c-2.13 1.43-4.86 2.27-8.21 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
              transform="translate(0 -4)"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {authError && <p className="auth-error">{authError}</p>}

        <p>
          {isLogin ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setAuthError("");
            }}
          >
            {isLogin ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    );
  }

  return (
    <main className={`app ${darkMode ? "dark-mode" : ""}`}>
     
<nav className="sidebar">

  <button
    className={activePage === "Dashboard" ? "active" : ""}
    onClick={() => setActivePage("Dashboard")}
  >
    Dashboard
  </button>

  <button
    className={activePage === "Transactions" ? "active" : ""}
    onClick={() => setActivePage("Transactions")}
  >
    Transactions
  </button>

  <button
    className={activePage === "Budgets" ? "active" : ""}
    onClick={() => setActivePage("Budgets")}
  >
    Budgets
  </button>

  <button
    className={activePage === "Analytics" ? "active" : ""}
    onClick={() => setActivePage("Analytics")}
  >
    Analytics
  </button>

  <button
    className={activePage === "Data Management" ? "active" : ""}
    onClick={() => setActivePage("Data Management")}
  >
    Data Management
  </button>
</nav>

      <header className="app-header">
        <div>

<div className="brand-heading">
  <div className="brand-logo" aria-label="Smart Expense Tracker logo">
    ₹
  </div>
  <div>
    <p className="eyebrow">PERSONAL FINANCE</p>
    <h1>Smart Expense Tracker</h1>
  </div>
</div>

          
          <p>Understand where your money goes.</p>
        </div>

<button
  type="button"
  className="theme-toggle"
  onClick={() => setDarkMode((current) => !current)}
>
  <span className="theme-toggle-icon">
    {darkMode ? "☀" : "☾"}
  </span>
  <span>{darkMode ? "Light mode" : "Dark mode"}</span>
</button>

       
<button
  type="button"
  className="sign-out-button"
  onClick={async () => {
    await signOut(auth);
    setShowLanding(false);
  }}
>
  <span>↪</span>
  Sign out
  
</button>

      </header>
      {activePage === "Dashboard" && (
  <>

<section className="summary">
  <article className="summary-card">
    <p>Total Income</p>
    <h2>{money(income)}</h2>
  </article>


  <article className="summary-card">
    <p>Remaining Balance</p>
    <h2>{money(income - expenses)}</h2>
  </article>

  <article className="summary-card">
    <p>Savings Rate</p>
    <h2>{savingsRate}%</h2>
  </article>


<div className="month-filter">
  <label htmlFor="selectedMonth">Filter by month</label>
  <input
    id="selectedMonth"
    type="month"
    value={selectedMonth}
    onChange={(event) => setSelectedMonth(event.target.value)}
  />
</div>


        <article className="summary-card">
          <p>Total Expenses</p>
          <h2>{money(expenses)}</h2>
        </article>
      </section>



<section className="panel spending-insights">
  <h2>Smart Spending Insights</h2>
  <p className="insights-description">
    Insights based on your selected month's transactions.
  </p>

  <div className="insights-grid">
    <article className="insight-card">
      <p>Total spent this month</p>
      <h3>{money(totalExpenses)}</h3>
    </article>

    <article className="insight-card">
      <p>Highest spending category</p>
      <h3>
        {highestSpendingCategory
          ? highestSpendingCategory[0]
          : "No expenses yet"}
      </h3>
      {highestSpendingCategory && (
        <span>{money(highestSpendingCategory[1])}</span>
      )}
    </article>
  </div>

  <div className="budget-insights">
    <h3>Budget alerts</h3>

    {budgetWarnings.length === 0 ? (
      <p>No budget warnings. Keep it up!</p>
    ) : (
      budgetWarnings.map(([category, spent]) => {
        const budget = Number(budgets[category]) || 0;
        const exceeded = spent >= budget;

        return (
          <p key={category}>
            {exceeded ? "⚠️" : "🔔"} {category}: spent{" "}
            {money(spent)} of {money(budget)}
            {exceeded ? " — Budget exceeded!" : " — Approaching limit"}
          </p>
        );
      })
    )}
  </div>
</section>
  </>
)}
{activePage === "Analytics" && (
      <section className="chart-section">
        <h2>Expenses by Category</h2>

        {expenseByCategory.length === 0 ? (
          <p>No expense data available yet.</p>
        ) : (
          <div style={{ width: "100%", height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, value }) =>
                    `${name}: ₹${Number(value).toLocaleString("en-IN")}`
                  }
                  labelLine={{ stroke: "#64748B" }}
                >
                  {expenseByCategory.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={[
                        "#10B981",
                        "#3B82F6",
                        "#8B5CF6",
                        "#F59E0B",
                        "#EF4444",
                        "#06B6D4",
                        "#F97316",
                      ][index % 7]}
                      stroke="#151F30"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>


<Tooltip
  formatter={(value, name) => [
    `₹${Number(value).toLocaleString("en-IN")}`,
    name,
  ]}
  contentStyle={{
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    borderRadius: "12px",
    border: "1px solid #CBD5E1",
  }}
/>


                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "16px",
                    color: "#1E293B",
                    fontWeight: 600,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
          </div>
          
        )}
      </section>
)}

{activePage === "Analytics" && (
  <section className="chart-container">
    <h2>Monthly Spending Trend</h2>
    <p className="muted">
      Compare your expenses across months.
    </p>

    {monthlySpending.length === 0 ? (
      <p className="muted">No monthly spending data available yet.</p>
    ) : (
      <div className="monthly-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={monthlySpending}
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#94A3B8"
              opacity={0.3}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickFormatter={(value) =>
                `₹${Number(value).toLocaleString("en-IN")}`
              }
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={85}
            />
            <Tooltip
              formatter={(value) => [
                `₹${Number(value).toLocaleString("en-IN")}`,
                "Expenses",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #CBD5E1",
              }}
            />
            <Legend />
            <Bar
              dataKey="expenses"
              name="Monthly expenses"
              fill="#10B981"
              radius={[6, 6, 0, 0]}
              maxBarSize={55}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </section>
)}

{activePage === "Budgets" && (
<section className="budget-section">
  <h2>Monthly Category Budgets</h2>
  <p>Set spending limits for the selected month.</p>

  <div className="budget-grid">
    {budgetSpending.map((item) => (
      <div className="budget-card" key={item.category}>
        <h3>{item.category}</h3>

        <label>
          Monthly budget (₹)
          <input
            type="number"
            min="0"
            placeholder="Enter budget"
            value={budgets[item.category] ?? ""}
            onChange={(e) =>
              setBudgets((previous) => ({
                ...previous,
                [item.category]: e.target.value,
              }))
            }
          />
        </label>

        <p>
          Spent: ₹{item.spent.toLocaleString("en-IN")}
        </p>

        <p>
          Remaining: ₹{item.remaining.toLocaleString("en-IN")}
        </p>

        <div className="budget-progress">
          <div
            className="budget-progress-fill"
            style={{
              width: `${
                item.budget > 0
                  ? Math.min((item.spent / item.budget) * 100, 100)
                  : 0
              }%`,
              backgroundColor:
                item.budget > 0 && item.spent > item.budget
                  ? "#ef4444"
                  : "#10b981",
            }}
          />
        </div>

        {item.budget > 0 && item.spent > item.budget && (
          <p className="budget-warning">
            Budget exceeded!
          </p>
        )}
      </div>
    ))}
  </div>
</section>
)}
    {activePage === "Transactions" && (
      <section className="panel">
        <h2>
          {editingId !== null ? "Edit transaction" : "Add a transaction"}
        </h2>

        <form onSubmit={addTransaction} className="transaction-form">
          <label>
            Description

        <input
        value={description}
       onChange={(event) => {
        const value = event.target.value;
        setDescription(value);

       if (type !== "income") {
        setCategory(categorize(value));
       }
     }}
    placeholder="Description"
     required
/>

          </label>

          <label>
            Amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="500"
              required
            />
          </label>

          <label>
            Type
            <select
              value={type}

onChange={(event) => {
  const selectedType = event.target.value;
  setType(selectedType);


setCategory(
  selectedType === "income"
    ? "Income"
    : categorize(description)
);
}}


            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </label>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>


<label>
  Category
  <select
    value={category}
    onChange={(event) => setCategory(event.target.value)}
    required
  >
    <option value="Other">Other</option>
    <option value="Groceries">Groceries</option>
    <option value="Food">Food</option>
    <option value="Transport">Transport</option>
    <option value="Shopping">Shopping</option>
    <option value="Bills">Bills</option>
    <option value="Subscriptions">Subscriptions</option>
    <option value="Education">Education</option>
    <option value="Income">Income</option>
  </select>
</label>


          <button type="submit" disabled={saving}>
            {saving
              ? "Saving..."
              : editingId !== null
                ? "Update transaction"
                : "Save transaction"}
          </button>

          {editingId !== null && (
<button
  type="button"
  className="clear-form-button"
  onClick={() => {
    setDescription("");
    setAmount("");
    setCategory("Other");
    setType("expense");
    setDate(new Date().toLocaleDateString("en-CA"));
    setEditingId(null);
    setMessage("");
  }}
  disabled={saving}
>
  {editingId !== null ? "Cancel edit" : "Clear form"}
</button>
          )}
        </form>
        

        <p className="message" role="status">

{message && (
  <div className="toast-notification" role="status">
    <span className="toast-icon">✓</span>
    <span>{message}</span>
  </div>
)}

        </p>
      </section>
    )}
  
{activePage === "Data Management" && (
  <section className="panel">
    <div className="export-actions">
      <button
        type="button"
        className="export-csv-button"
        onClick={exportToCSV}
      >
        <span className="export-icon">↓</span>
        <span>Export CSV</span>
      </button>

      <button
        type="button"
        className="export-csv-button"
        onClick={exportToPDF}
      >
        <span className="export-icon">↓</span>
        <span>Export PDF</span>
      </button>
    </div>

    <section className="panel">
      <h2>Import bank statement</h2>

      <p className="muted">
        Import a CSV with Description and Amount columns, or
        Description with Debit and Credit columns.
      </p>

      <label className="import-button">
        {importing ? "Importing..." : "Choose CSV file"}
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={importCSV}
          disabled={importing}
        />
      </label>
    </section>
  </section>
)}

      {activePage === "Transactions" && (

      <section className="panel">
       <h2>Transactions ({filteredTransactions.length})</h2>
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="transaction-search"
        />
       
<div className="transaction-filters">
  <select
    className="category-filter"
    value={categoryFilter}
    onChange={(event) => {
      setCategoryFilter(event.target.value);
      setCurrentPage(1);
    }}
  >
    <option value="All">All Categories</option>
    <option value="Food">Food</option>
    <option value="Groceries">Groceries</option>
    <option value="Transport">Transport</option>
    <option value="Shopping">Shopping</option>
    <option value="Bills">Bills</option>
    <option value="Subscriptions">Subscriptions</option>
    <option value="Education">Education</option>
    <option value="Other">Other</option>
  </select>

  <select
    className="category-filter"
    value={sortBy}
    onChange={(event) => {
      setSortBy(event.target.value);
      setCurrentPage(1);
    }}
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
    <option value="highest">Highest Amount</option>
    <option value="lowest">Lowest Amount</option>
  </select>

<button
  type="button"
  className="clear-filters-button"
  onClick={() => {
    setSearchTerm("");
    setCategoryFilter("All");
    setSortBy("newest");
    setCurrentPage(1);
  }}
>
  Clear Filters
</button>
</div>

        {loading ? (
          <p className="muted">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="muted">
            No transactions yet. Add one or import a CSV.
          </p>
        ) : (

<div className="transaction-list">
  {(() => {
    const matchingTransactions = transactions
      .filter((item) => {
        const matchesSearch = (item.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === "All" || item.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "highest") {
          return Number(b.amount) - Number(a.amount);
        }

        if (sortBy === "lowest") {
          return Number(a.amount) - Number(b.amount);
        }

        const dateA = String(a.date || "");
        const dateB = String(b.date || "");

        return sortBy === "oldest"
          ? dateA.localeCompare(dateB)
          : dateB.localeCompare(dateA);
      });

    const startIndex = (currentPage - 1) * transactionsPerPage;
    const pageItems = matchingTransactions;
      startIndex,
      startIndex + transactionsPerPage
  

    let previousDate = null;

    return pageItems.map((item) => {
      const transactionDate = String(item.date || "");
      const showDateHeading = transactionDate !== previousDate;
      previousDate = transactionDate;

      return (
        <div className="transaction-day-group" key={item.id}>
          {showDateHeading && (
            <h3 className="transaction-date-heading">
              {formatTransactionDay(item.date)}
            </h3>
          )}

          <article className="transaction-row">
            <div>
              <strong>{item.description}</strong>
              <p className="muted">{item.category}</p>
            </div>
<button
  type="button"
  className="transaction-action edit-button"
  onClick={() => {
    setDescription(item.description ?? "");
    setAmount(String(item.amount ?? ""));
    setType(
      String(item.type).toLowerCase() === "income"
        ? "income"
        : "expense"
    );
    setDate(String(item.date ?? "").slice(0, 10));
    setCategory(item.category || "Other");
    setEditingId(item.id);
    setMessage("");

    document
      .querySelector(".transaction-form")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
  }}
  title="Edit transaction"
  aria-label={`Edit ${item.description}`}
>
  Edit
</button>
            

            <div className="transaction-actions">
              <strong
                className={
                  item.type?.toLowerCase() === "income"
                    ? "positive"
                    : "negative"
                }
              >
                {item.type?.toLowerCase() === "income" ? "+" : "−"}
                {money(Math.abs(Number(item.amount) || 0))}
              </strong>

              <button
                className="delete-button"
                type="button"
                onClick={() => deleteTransaction(item.id)}
              >
                Delete
              </button>
            </div>
          </article>
        </div>
      );
    });
  })()}
</div>
        )}
      </section>
      )}
    </main>
  );
}

export default App;
