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

//Importing transaction
const { createTransaction } = require("../../helpers/transactions");

//Adding money to the wallet
app.post("/addMoney", verify, async (req, res) => {
  const { userId, amountToAdd } = req.body;

  //VALIDATING THE DATA RECIVED FROM THE REQUEST
  const { error } = addingMoneyWalletValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // Verifing user id
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  // Checking for the wallet id
  try {
    var walletStatus = await Wallet.findOne({ user: userId });

    // Checking for user status
    var userStatus = await User.findById(userId);

    if (!userStatus) {
      return res
        .status(400)
        .json({ message: "User not found", status: "error" });
    }

    if (!walletStatus) {
      //Create Wallet
      var userWallet = new Wallet({
        amountInWallet: amountToAdd,
        lastAmountAdded: Date.now(),
        user: userId,
      });

      await userWallet.save();

      // Then add the wallet id
      var userUpdateStatus = await User.findByIdAndUpdate(userId, {
        wallet: userWallet.id,
      });

      await createTransaction(userId, amountToAdd, "Deposit", userWallet.id);

      return res.status(200).json({
        status: "success",
        message: `Wallet Created Successfully! and added Rs. ${amountToAdd}`,
      });
    } else {
      // If wallet is already created
      var walletId = walletStatus.id;

      var totalWalletAmount = walletStatus.amountInWallet + amountToAdd;

      var walletAmountUpdateStatus = await Wallet.findByIdAndUpdate(walletId, {
        amountInWallet: totalWalletAmount,
        lastAmountAdded: Date.now(),
      });

      await createTransaction(userId, amountToAdd, "Deposit", walletId);

      return res.status(200).json({
        status: "success",
        message: `Rs. ${amountToAdd} added to wallet successfully`,
      });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Unable to add the game" });
  }
});

module.exports = app;
