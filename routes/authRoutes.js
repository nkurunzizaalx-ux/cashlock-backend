const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// USER REGISTRATION
router.post("/register", authController.register);

// USER LOGIN
router.post("/login", authController.login);

// CHECK IF USER EXISTS (optional)
router.get("/check-user/:phone", async (req, res) => {
  try {
    let phone = req.params.phone;

    // Normalize phone same as controller logic
    phone = phone.replace(/\s+/g, "");
    if (phone.startsWith("+250")) phone = phone.replace("+250", "250");
    if (phone.startsWith("07")) phone = "250" + phone;

    const User = require("../models/User");
    const user = await User.findOne({ phone });

    return res.status(200).json({
      success: true,
      exists: !!user,
    });

  } catch (error) {
    console.error("Check User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

// OPTIONAL: Normalize phone route (debugging only)
router.get("/normalize/:phone", (req, res) => {
  let phone = req.params.phone.replace(/\s+/g, "");
  if (phone.startsWith("+250")) phone = phone.replace("+250", "250");
  if (phone.startsWith("07")) phone = "250" + phone;

  res.json({ normalized: phone });
});

module.exports = router;
