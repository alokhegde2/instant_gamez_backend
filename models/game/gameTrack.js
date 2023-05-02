const mongoose = require("mongoose");

//Result Schema
const gameTrack = new mongoose.Schema({
    date: {
        type: Date
    },
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Games",
    },
});

//Creating virtual id
gameTrack.virtual("id").get(function () {
    return this._id.toHexString();
});

gameTrack.set("toJSON", {
    virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("gamedate", gameTrack);
