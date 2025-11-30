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
app.use(express.urlencoded({ extended: true })); // Important for Render deployments


// -------------------------------
// ROUTES IMPORTS
// -------------------------------
const authRoutes = require("./routes/authRoutes");
const planRoutes = require("./routes/planRoutes");
const momoRoutes = require("./routes/momoRoutes");
const walletRoutes = require("./routes/walletRoutes");
const unlockRoutes = require("./routes/unlockRoutes");
const topupRoutes = require("./routes/topup");   // ⭐ NEW TOPUP ROUTE


// -------------------------------
// AUTO UNLOCK CRON JOB
// -------------------------------
require("./cron/unlockScheduler"); // Cron job runs every minute


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
  res.send("CashLock backend is running with MongoDB + Unlock Engine!");
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
app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/momo", momoRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/unlock", unlockRoutes);
app.use("/api/topup", topupRoutes);  // ⭐ ACTIVATE TOPUP ROUTE


// -------------------------------
// DEBUG ROUTE
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
