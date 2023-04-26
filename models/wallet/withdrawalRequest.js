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
    amount: {
        type: Number,
        default: 10
    },
    isApprove: {
        type: Boolean,
        default: false
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
