const mongoose = require("mongoose");

//Result Schema
const resultSchema = new mongoose.Schema({
  resultString: {
    type: String,
    default: "***_**_***",
  },
  anouncedDateTime: {
    type: Date,
    default: Date.now(),
  },
  winners: {
    type: [mongoose.Schema.Types.ObjectId],
    default: [],
    ref: "Users",
  },
  isRollbacked: {
    type: Boolean,
    default: false,
  },
  rollbackedDateTime: {
    type: Date,
    default: null,
  },
  reasonForRollback: {
    type: String,
    default: "",
  },
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Game",
  },
});

//Creating virtual id
resultSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

resultSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Results", resultSchema);
