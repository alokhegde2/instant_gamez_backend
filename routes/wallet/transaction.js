const express = require("express");
const mongoose = require("mongoose");

const app = express();

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Transactions = require("../../models/wallet/transaction");

//Getting the transactions of the specific user
app.get("/:id", verify.verify, async (req, res) => {
  const { id } = req.params;

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);
  const transType = req.query.transType;

  const startIndex = (page - 1) * limit;

  // Verifing user id
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    if (transType == "Transactions") {
      var transaction = await Transactions.find({
        user: id,
        $or: [
          { typeOfTransaction: "Deposit" },
          { typeOfTransaction: "Withdraw" },
        ],
      }).sort({ dateOfTransaction: -1 });
    } else if (transType == "Biddings") {
      var transaction = await Transactions.find({
        user: id,
        $or: [
          { typeOfTransaction: "Rollback" },
          { typeOfTransaction: "Winning" },
          { typeOfTransaction: "GamePlay" },
        ],
      }).sort({ dateOfTransaction: -1 });
    } else {
      var transaction = await Transactions.find({
        user: id,
        typeOfTransaction: "Refer",
      }).sort({ dateOfTransaction: -1 });
    }
    return res
      .status(200)
      .json({ status: "success", transactions: transaction });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error, status: "error" });
  }
});

module.exports = app;
