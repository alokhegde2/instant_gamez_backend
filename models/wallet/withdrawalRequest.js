const mongoose = require("mongoose");

//wallet Schema
const withdrawalRequest = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Users",
    },
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "wallets",
    },
    description: {
        type: String,
        default: ""
    },
    amount: {
        type: Number,
        default: 10
    },
    deduction: {
        type: Number,
        default: 0
    },
    payableAmount: {
        type: Number,
        default: 0
    },
    isApprove: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

//Creating virtual id
withdrawalRequest.virtual("id").get(function () {
    return this._id.toHexString();
});

withdrawalRequest.set("toJSON", {
    virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("withdrawal", withdrawalRequest);
