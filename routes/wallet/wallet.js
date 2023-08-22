const express = require("express");
const mongoose = require("mongoose");

const app = express();

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");
const offerSchema = require('../../models/user/offer')
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
const config = require("../../models/admin/config");
const referralSchema = require("../../models/user/referralSchema");
const withdrawalRequest = require("../../models/wallet/withdrawalRequest");

//Adding money to the wallet
app.post("/addMoney", verify.verify,
  async (req, res) => {
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
      const getOffer = await offerSchema.findOne({ userId: mongoose.Types.ObjectId(userId), isUsed: false })
      const { ObjectId } = mongoose.Types;
      const offerQuery = { userId: ObjectId(userId), isUsed: false };
      const referralQuery = { to: userId };
      const amount = amountToAdd * 0.1;
      const updateOffer = { creditedAmount: amount, isUsed: true };
      const updateReferral = { creditedAmount: amount, isUsed: true };

      var getConfig = await config.findOne();
      if (getConfig != undefined && getConfig != null && getConfig.minDeposit > amountToAdd) {
        return res.status(400).send({ message: `Amount to add must be at least ${getConfig.minDeposit}`, status: 'error' });
      }
      // Checking for user status
      var userStatus = await User.findById(userId);

      if (!userStatus) {
        return res
          .status(400)
          .json({ message: "User not found", status: "error" });
      }

      if (!walletStatus) {
        let amountToAddWithOffer = amountToAdd;

        // Create Wallet document with the updated amount
        const userWallet = new Wallet({
          amountInWallet: amountToAddWithOffer,
          lastAmountAdded: Date.now(),
          user: userId,
        });

        await userWallet.save();

        if (getOffer) {

          const [offerRecord, referralRecord] = await Promise.all([
            offerSchema.findOneAndUpdate(offerQuery, updateOffer, { new: true }),
            referralSchema.findOneAndUpdate(referralQuery, updateReferral, { new: true })
          ]);
          const walletQuery = { user: ObjectId(referralRecord.from) };
          const walletUpdate = {
            $inc: {
              amountInWallet: amount
            }
          };
          const walletRecord = await Wallet.findOneAndUpdate(walletQuery, walletUpdate, { new: true }).lean();
          console.log(walletRecord)
          await createTransaction(referralRecord.from, amount, "Bonus", walletRecord._id);

        }

        // Then add the wallet id
        var userUpdateStatus = await User.findByIdAndUpdate(userId, {
          wallet: userWallet.id,
        });

        await createTransaction(userId, amountToAdd, "Deposit", userWallet.id);

        return res.status(200).json({
          status: "success",
          message: `Wallet Created Successfully! and added Rs. ${amountToAddWithOffer}`,
        });
      } else {
        // If wallet is already created
        var walletId = walletStatus.id;
        let amountToAddWithOffer = amountToAdd;

        if (getOffer) {

          const [offerRecord, referralRecord] = await Promise.all([
            offerSchema.findOneAndUpdate(offerQuery, updateOffer, { new: true }),
            referralSchema.findOneAndUpdate(referralQuery, updateReferral, { new: true })
          ]);
          const walletQuery = { user: ObjectId(referralRecord.from) };
          const walletUpdate = { $inc: { amountInWallet: amount } };

          const walletRecord = await Wallet.findOneAndUpdate(walletQuery, walletUpdate, { new: true }).lean();
          await createTransaction(referralRecord.from, amount, "Bonus", walletRecord._id);

        }

        var totalWalletAmount = walletStatus.amountInWallet + amountToAddWithOffer;

        var walletAmountUpdateStatus = await Wallet.findByIdAndUpdate(walletId, {
          amountInWallet: totalWalletAmount,
          lastAmountAdded: Date.now(),
        });

        await createTransaction(userId, amountToAdd, "Deposit", walletId);

        return res.status(200).json({
          status: "success",
          message: `Rs. ${amountToAddWithOffer} added to wallet successfully`,
        });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Unable to add the game" });
    }
  });
app.post("/withdrawMoney", verify.verify,
  async (req, res) => {
    const { amount } = req.body;
    const { id: userId } = req.user
    // Verifing user id
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    // Verifing user id
    if (!amount) {
      return res.status(400).json({ message: "please pass amount" });
    }


    // Checking for the wallet id
    try {
      var getConfig = await config.findOne();
      if (getConfig != undefined && getConfig != null && getConfig.minWithdrawal > amount) {
        return res.status(400).send({ message: `Amount to withdraw must be at least ${getConfig.minWithdrawal}`, status: 'error' });
      }
      // Checking for user status
      var userStatus = await User.findById(userId);

      if (!userStatus) {
        return res
          .status(400)
          .json({ message: "User not found", status: "error" });
      }
      var walletStatus = await Wallet.findOne({ user: userId });

      if (walletStatus) {
        const walletId = walletStatus.id;
        if (walletStatus.gameWinning < amount) {
          return res.status(400).send({ message: `insufficient amount to withdraw`, status: 'error' });
        }
        const walletUpdate = {
          $inc: {
            gameWinning: -amount,
            withdraw: amount
          }
        };
        let deduction = amount * 0.02
        const walletRecord = await Wallet.findByIdAndUpdate(walletId, walletUpdate, { new: true }).lean();
        await new withdrawalRequest({
          walletId: walletId,
          userId: userId,
          amount: amount,
          deduction: deduction,
          payableAmount: amount - deduction
        }).save()
        await createTransaction(userId, amount, "Withdraw", walletId);

        return res.status(200).json({
          status: "success",
          message: `Rs. ${amount} withdrawal request successfully`,
        });
      }
      return res.status(400).send({ message: `no wallet found`, status: 'error' });

    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Unable to add the game" });
    }
  });

app.get("/getWithdrawRequest", verify.verifyAdmin,
  async (req, res) => {
    try {
      const withdrawals = await withdrawalRequest.aggregate([
        {
          $match: {
            isApprove: 0
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'walletId',
            foreignField: '_id',
            as: 'wallet'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $addFields: {
            createdAt: {
              $dateToString: { format: '%d/%m/%Y %H:%M', date: '$createdAt' }
            }
          }
        }
      ]);
      const actionWithdrawal = await withdrawalRequest.aggregate([
        {
          $match: {
            isApprove: { $in: [1, 2, 3] }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $lookup: {
            from: 'wallets',
            localField: 'walletId',
            foreignField: '_id',
            as: 'wallet'
          }
        },
        {
          $sort: { createdAt: -1 }
        },
        {
          $addFields: {
            createdAt: {
              $dateToString: { format: '%d/%m/%Y %H:%M', date: '$createdAt' }
            }
          }
        }
      ]);

      return res.status(200).json({
        status: "success",
        data: [...withdrawals, ...actionWithdrawal],
        message: `withdrawal request found successfully`,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Unable to found withdrawal request" });
    }
  });

app.put("/getWithdrawRequest", verify.verifyAdmin,
  async (req, res) => {
    try {
      const withdrawals = await withdrawalRequest.find({}).populate({
        path: 'userId',
        select: 'phoneNumber',
      }).populate({
        path: 'walletId',
        select: 'amountInWallet gameWinning withdraw',
      }).sort({ isApprove: 1, createdAt: -1 }); // add this line


      return res.status(200).json({
        status: "success",
        data: withdrawals,
        message: `withdrawal request found successfully`,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ status: "error", message: "Unable to found withdrawal request" });
    }
  });
app.post('/updateWithdrawRequest', async (req, res) => {
  try {
    // Get the withdrawrequestId from the body
    const { withdrawrequestId, status, description } = req.body
    // Update the withdrawrequest status
    // Update the withdrawal status

    const withdrawRequestUpdate = await withdrawalRequest.findByIdAndUpdate(withdrawrequestId,
      {
        isApprove: status,
        description: description
      });
    if (status == 2) {
      await Wallet.findByIdAndUpdate(withdrawRequestUpdate.walletId, {
        $inc: {
          withdraw: -withdrawRequestUpdate.amount,
          withdrawGame: withdrawRequestUpdate.amount
        }
      })
      await createTransaction(withdrawRequestUpdate.userId, withdrawRequestUpdate.amount, "Withdraw", withdrawRequestUpdate.walletId);

      // const walletRecord = await Wallet.findByIdAndUpdate(walletId, walletUpdate, { new: true }).lean();)
    } else if (status == 3) {
      await Wallet.findByIdAndUpdate(withdrawRequestUpdate.walletId, {
        $inc: {
          gameWinning: withdrawRequestUpdate.amount,
          withdraw: -withdrawRequestUpdate.amount
        }
      })
      await createTransaction(withdrawRequestUpdate.userId, withdrawRequestUpdate.amount, "Refund Withdraw", withdrawRequestUpdate.walletId);

    }
    // Successfully update the withdrawrequest status
    res.status(200).json({
      message: 'Withdrawrequest status successfully updated',
    });
  } catch (error) {
    // Handle the error
    console.log(error);
    res.status(500).json({
      message: 'An error occurred while updating the withdrawal status',
    });
  }
});

module.exports = app;
