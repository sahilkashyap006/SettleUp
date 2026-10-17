
require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");

const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const settlementRoutes = require("./routes/settlementRoutes");
const authRoutes = require("./routes/authRoutes");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json({ limit: "10kb" }));

// Home route
app.get("/", (req, res) => {
  res.send("SettleUp Backend is running!");
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SettleUp API is healthy",
  });
});

// Public authentication test route
app.get("/api/auth/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route connected",
  });
});

// Protected authentication test route
app.get("/api/auth/protected", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You are authenticated!",
    userId: req.user.userId,
  });
});

// Application routes
app.use("/api/auth", authRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/settlements", settlementRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Handle unexpected errors
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.status && err.status < 500
        ? err.message
        : "Internal server error.",
  });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
