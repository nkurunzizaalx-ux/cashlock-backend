// -------------------------------
//   CashLock Backend - MTN MoMo + MongoDB + Withdrawals
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
const topupRoutes = require("./routes/topupRoutes");
const momoCallbackRoutes = require("./routes/momoCallbackRoutes");
const withdrawRoutes = require("./routes/withdrawRoutes");  // ✅ NEW WITHDRAWAL ROUTES


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
  res.send("CashLock backend is running with MongoDB + Unlock Engine + Withdrawals!");
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
app.use("/api/topup", topupRoutes);
app.use("/withdraw", withdrawRoutes); // ⭐ WITHDRAWAL ENDPOINTS ACTIVE


// -------------------------------
// DEBUG ENV ROUTE
// -------------------------------
app.get("/debug-env", (req, res) => {
  res.json({
    MTN_API_USER: process.env.MTN_API_USER || "EMPTY",
    MTN_API_KEY: process.env.MTN_API_KEY || "EMPTY",
    MTN_COLLECTION_KEY: process.env.MTN_COLLECTION_KEY || "EMPTY",
    MTN_DISBURSEMENT_KEY: process.env.MTN_DISBURSEMENT_KEY || "EMPTY",
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
