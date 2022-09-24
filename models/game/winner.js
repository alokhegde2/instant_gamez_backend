const mongoose = require("mongoose");

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
  wonCategory: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Category",
  },
  resultAnouncedAt: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
winnerSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

winnerSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Results", winnerSchema);
