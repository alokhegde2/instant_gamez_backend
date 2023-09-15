const express = require("express");
const mongoose = require("mongoose");

const app = express();

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Transactions = require("../../models/wallet/transaction");
const Withdraw = require("../../models/wallet/withdrawalRequest");

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
          { typeOfTransaction: "GamePlay" },
          { typeOfTransaction: "Refer" },
        ],
      }).sort({ dateOfTransaction: -1 });
    } else if (transType == "DW") {
      var transaction = await Transactions.find({
        user: id,
        $or: [
          { typeOfTransaction: "Deposit" },
        ],
      }).sort({ dateOfTransaction: -1 });
    } else if (transType == "WB") {
      var transaction = await Transactions.find({
        user: id,
        $or: [
          { typeOfTransaction: "Rollback" },
          { typeOfTransaction: "Winning" },
          { typeOfTransaction: "GamePlay" },
        ],
      }).sort({ dateOfTransaction: -1 });
    } else if (transType == "W") {
      const status = true;
      var transaction = await Withdraw.find({
        userId: id,
      })
        .select({
          user: "$userId",
          wallet: "$walletId",
          amountOfTransaction: "$amount",
          typeOfTransaction: "Withdraw",
          dateOfTransaction: "$updatedAt",
          message: "$description",
          createdDate: "$createdAt",
          id:"$_id",
          status: {
            $cond: {
              if: { $eq: ["$isApprove", 0] },
              then: "Pending",
              else: {
                $cond: {
                  if: { $eq: ["$isApprove", 2] },
                  then: "Approved",
                  else: "Rejected",
                },
              },
            },
          },
        })
        .sort({ createdAt: -1 });

      // Manually add a hardcoded boolean value to each document
      const resultsWithHardcodedValue = transaction.map((doc) => ({
        ...doc.toObject(),
        isSuccess: true,
        __v: 0, // Change this to your desired boolean value
      }));

      transaction = resultsWithHardcodedValue;
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

//Getting bank account statement

app.get("/account/statement/:id", verify.verify, async (req, res) => {
  const { id } = req.params;

  try {
    var transaction = await Transactions.find({
      user: id,
      $or: [
        { typeOfTransaction: "Deposit" },
        { typeOfTransaction: "Withdraw" },
        { typeOfTransaction: "Winning" },
      ],
    }).sort({ dateOfTransaction: -1 });
    return res
      .status(200)
      .json({ status: "success", transactions: transaction });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error, status: "error" });
  }
});

module.exports = app;
