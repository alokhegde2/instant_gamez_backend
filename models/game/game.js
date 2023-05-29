const mongoose = require("mongoose");
const gameTrack = require("./gameTrack");

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
  disabledDate: {
    type: Date,
    // default: Date.now(),
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
gameSchema.post(["save", "findOneAndUpdate", "updateOne"], async function (doc, next) {
  console.log(doc)
  console.log("openBiddingTime: ", doc.openBiddingTime);
  console.log("closingBiddingTime: ", doc.closingBiddingTime);
  const datetime = new Date(doc.closingBiddingTime);
  const start = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), 0, 0, 0);
  const end = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), 23, 59, 59);

  let checkGame = await gameTrack.find({ date: { $gte: start, $lte: end }, gameId: doc._id });
  if (checkGame.length == 0) await gameTrack({ date: doc.closingBiddingTime, gameId: doc._id }).save();

  next();
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
