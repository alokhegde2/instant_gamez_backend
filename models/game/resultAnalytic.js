const mongoose = require("mongoose");

//Category Schema
const resultAnalytic = new mongoose.Schema({
    resultId: {
        type: mongoose.Types.ObjectId,
        ref: 'results'
    },
    bidding: [mongoose.Types.ObjectId]
});
// gameSchema.post(["save", "findOneAndUpdate", "updateOne"], async function (doc, next) {
//   // console.log(doc)
//   // console.log("openBiddingTime: ", doc.openBiddingTime);
//   // console.log("closingBiddingTime: ", doc.closingBiddingTime);
//   const datetime = new Date(doc.closingBiddingTime);
//   const start = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), 0, 0, 0);
//   const end = new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), 23, 59, 59);

//   let checkGame = await gameTrack.find({ date: { $gte: start, $lte: end }, gameId: doc._id });
//   if (checkGame.length == 0) await gameTrack({ date: doc.closingBiddingTime, gameId: doc._id }).save();

//   next();
// });

//Creating virtual id
resultAnalytic.virtual("id").get(function () {
    return this._id.toHexString();
});

resultAnalytic.set("toJSON", {
    virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("resultanalysis", resultAnalytic);
