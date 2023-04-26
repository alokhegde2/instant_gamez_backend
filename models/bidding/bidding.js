const mongoose = require("mongoose");

//wallet Schema
const biddingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Users",
  },
  amountBidded: {
    type: Number,
    required: true,
    default: 0,
  },
  biddedCategory: {
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
  biddingOn: {
    type: String,
    enum: ["Open", "Close"],
  },
  biddingNumber: {
    type: String,
    required: true,
  },
  game: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: "Game",
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
biddingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

biddingSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("biddings", biddingSchema);
