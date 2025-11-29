// -------------------------------
//   CashLock Backend - MTN MoMo + MongoDB
// -------------------------------

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------
// ROUTES IMPORTS
// -------------------------------
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const momoRoutes = require("./routes/momoRoutes");   // ✅ NEW


// -------------------------------
// MONGODB CONNECTION
// -------------------------------
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in environment variables");
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected successfully"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
}


// -------------------------------
// ROOT ROUTE
// -------------------------------
app.get("/", (req, res) => {
  res.send("CashLock backend is running with MongoDB!");
});


// -------------------------------
// TEST ROUTE
// -------------------------------
app.get("/api/test", (req, res) => {
  res.json({ message: "CashLock API test working!" });
});


// -------------------------------
// ROUTES MOUNT
// -------------------------------
app.use("/api/auth", authRoutes);     // Authentication routes
app.use("/api/plans", planRoutes);    // Lock plan routes
app.use("/momo", momoRoutes);         // ✅ NEW: MTN MoMo routes


// -------------------------------
// DEBUG ROUTE - CHECK ENV VALUES
// -------------------------------
app.get("/debug-env", (req, res) => {
  res.json({
    MTN_API_USER: process.env.MTN_API_USER || "EMPTY",
    MTN_API_KEY: process.env.MTN_API_KEY || "EMPTY",
    MTN_SUBSCRIPTION_KEY: process.env.MTN_SUBSCRIPTION_KEY || "EMPTY",
    MTN_CALLBACK_URL: process.env.MTN_CALLBACK_URL || "EMPTY",
    MONGODB_URI: process.env.MONGODB_URI ? "SET" : "EMPTY",
  });
});


// -------------------------------
// START SERVER
// -------------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 CashLock backend running on port ${PORT}`);
});
