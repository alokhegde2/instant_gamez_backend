const mongoose = require("mongoose");

//wallet Schema
const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  amountOfTransaction: {
    type: Number,
    required: true
  },
  typeOfTransaction: {
    type: String,
    enum: ["Deposit", "Withdraw", "GamePlay", "Winning", "Rollback", "Refund", "Bonus"],
    default: "Deposit",
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "wallets",
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "Game",
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users'
  },
  dateOfTransaction: {
    type: Date,
    required: true,
  },
  isSuccess: {
    type: Boolean,
    default: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
transactionSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

transactionSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("transactions", transactionSchema);
