const express = require("express");
const router = express.Router();

const { initiateDeposit } = require("../controllers/depositController");

router.post("/initiate", initiateDeposit);

module.exports = router;
