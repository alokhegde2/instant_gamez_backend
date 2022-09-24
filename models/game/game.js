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
  openDate: {
    type: Number,
    required: [0, 1, 2, 3, 4, 5, 6],
  },
  DisabledDates: {
    type: [Date],
    default: [],
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  results: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: "Results",
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
  updatedDate: {
    type: Date,
    default: Date.now(),
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
