const mongoose = require("mongoose");

//Category Schema
const gameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  openBiddingTime: {
    type: Date,
    required: true,
  },
  closingBiddingTime: {
    type: Date,
    required: true,
  },
  isCancelled: {
    type: Boolean,
    required: true,
    default: false,
  },
  isResultAnnounced: {
    type: Boolean,
    required: true,
    default: false,
  },
  result: {
    type: String,
    required: false,
    default: "***_**_***",
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

//Creating virtual id
gameSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

gameSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Game", gameSchema);
