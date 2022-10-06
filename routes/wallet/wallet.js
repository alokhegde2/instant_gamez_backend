const express = require("express");
const mongoose = require("mongoose");

const app = express();

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Wallet = require("../../models/wallet/wallet");
const User = require("../../models/user/user");

// IMPORTING VALIDATION
const {
  addingMoneyWalletValidation,
} = require("../../validation/wallet/wallet_validation");

//Adding money to the wallet
app.post("/addMoney", verify, async (req, res) => {
  const { userId, amountToAdd } = req.body;

  // Verifing user id
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  // Checking for the wallet id
});
