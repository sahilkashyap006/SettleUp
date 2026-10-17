
require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const testRoutes = require("./routes/testRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const groupRoutes = require("./routes/groupRoutes");
const settlementRoutes = require("./routes/settlementRoutes");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("SettleUp Backend is running!");
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SettleUp API is healthy"
  });
});

app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/settlements", settlementRoutes);
app.use(testRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
