const mongoose = require("mongoose");
const categorySchema = require('../category/category')
//Result Schema
const winnerSchema = new mongoose.Schema({
  resultId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Results",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Games",
  },
  wonNumber: {
    type: String,
    required: true,
  },
  wonAmount: {
    type: Number,
    default: 0,
    required: true
  },
  winningCategory: {
    type: String,
    required: true,
    enum: [
      "Single",
      "Jodi",
      "Single Pana",
      "Double Pana",
      "Triple Pana",
      "Half Sangam",
      "Full Sangam",
    ],
  },
  wonCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "wallets"
  },
  resultAnouncedAt: {
    type: Date,
    default: Date.now(),
  },
});
winnerSchema.pre("save", async function (next) {
  try {
    const category = await categorySchema.findOne({
      name: this.winningCategory,
    });
    if (category) {
      this.wonCategory = category._id;
    }
    next();
  } catch (error) {
    next(error);
  }
});

//Creating virtual id
winnerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

winnerSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Winners", winnerSchema);
