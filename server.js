const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000; // Use Railway's dynamic port or fallback to 5000
const SECRET = process.env.JWT_SECRET || "your_jwt_secret"; // Optional: you can set this as an env variable

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// File upload setup
const upload = multer({ dest: "uploads/" });

// Open SQLite DB
let db;
(async () => {
  db = await open({
    filename: path.join(__dirname, "database.db"),
    driver: sqlite3.Database,
    mode: sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  });

  // Set busy timeout to 5 seconds
  await db.run("PRAGMA busy_timeout = 5000");

  // Create tables if they don't exist
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      password TEXT,
      gpa REAL,
      course TEXT
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS scholarships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      minGPA REAL,
      course TEXT,
      deadline TEXT
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      scholarshipId INTEGER,
      file TEXT,
      status TEXT DEFAULT 'Pending'
    )
  `);

  console.log("Database ready");
})();

// =================== ROUTES ===================

// Signup
app.post("/signup", async (req, res) => {
  const { name, email, password, gpa, course } = req.body;
  if (!name || !email || !password || !gpa || !course)
    return res.json({ message: "Please fill all fields" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.run(
      "INSERT INTO users (name, email, password, gpa, course) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashed, gpa, course]
    );
    res.json({ message: "User created" });
  } catch (err) {
    console.error(err);
    if (err.code === "SQLITE_CONSTRAINT") {
      res.json({ message: "Email already exists" });
    } else {
      res.json({ message: "Error creating user" });
    }
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await db.get("SELECT * FROM users WHERE email = ?", [email]);
  if (!user) return res.json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.json({ message: "Invalid password" });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET, {
    expiresIn: "1h",
  });

  res.json({ message: "Login successful", token });
});

// Middleware to verify JWT
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}

// Get scholarships
app.get("/scholarships", auth, async (req, res) => {
  const scholarships = await db.all("SELECT * FROM scholarships");
  res.json(scholarships);
});

// Add scholarship (admin)
app.post("/scholarships", async (req, res) => {
  const { title, description, minGPA, course, deadline } = req.body;
  if (!title || !description || !minGPA || !course || !deadline)
    return res.json({ message: "Please fill all fields" });

  await db.run(
    "INSERT INTO scholarships (title, description, minGPA, course, deadline) VALUES (?, ?, ?, ?, ?)",
    [title, description, minGPA, course, deadline]
  );
  res.json({ message: "Scholarship added" });
});

// Apply to scholarship
app.post("/apply/:id", auth, upload.single("file"), async (req, res) => {
  const scholarshipId = req.params.id;
  const userId = req.user.id;

  if (!req.file) return res.json({ message: "File is required" });

  const filePath = req.file.filename;
  await db.run(
    "INSERT INTO applications (userId, scholarshipId, file) VALUES (?, ?, ?)",
    [userId, scholarshipId, filePath]
  );

  res.json({ message: "Application submitted" });
});

// Load applications (admin)
app.get("/applications", async (req, res) => {
  const applications = await db.all("SELECT * FROM applications");
  res.json(applications);
});

// =================== START SERVER ===================
app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
