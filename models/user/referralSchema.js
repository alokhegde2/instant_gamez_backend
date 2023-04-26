const mongoose = require("mongoose");

//referralSchema
const referralSchema = new mongoose.Schema({
    from: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    to: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    isUsed: {
        type: Boolean,
        default: false
    }, creditedAmount: {
        type: Number,
        default: 0
    }
});

//Creating virtual id
referralSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

referralSchema.set("toJSON", {
    virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("referral", referralSchema);
