const mongoose = require("mongoose");

//User Schema
const config = new mongoose.Schema({
    minDeposit: {
        type: Number,
        default: 0
    },
    minWithdrawal: {
        type: Number,
        default: 0
    },
    Single: {
        type: Number,
        default: 1
    },
    Jodi: {
        type: Number,
        default: 1
    },
    RedBracket: {
        type: Number,
        default: 1
    },
    SinglePana: {
        type: Number,
        default: 1
    },
    DoublePana: {
        type: Number,
        default: 1
    },
    TriplePana: {
        type: Number,
        default: 1
    },
    HalfSangam: {
        type: Number,
        default: 1
    },
    FullSangam: {
        type: Number,
        default: 1
    }
});

//Exporting modules
module.exports = mongoose.model("config", config);
