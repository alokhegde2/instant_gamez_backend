const mongoose = require("mongoose");

//wallet Schema
const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  amountInWallet: {
    type: Number,
    required: true,
    min: 49,
  },
  gameWinning: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  withdraw: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  withdrawGame: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  lastAmountAdded: {
    type: Date,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
walletSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

walletSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("wallets", walletSchema);
