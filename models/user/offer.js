const mongoose = require("mongoose");

//User Schema
const offerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'users'
    },
    isUsed: {
        type: Boolean,
        default: false
    }
});

//Creating virtual id
offerSchema.virtual("id").get(function () {
    return this._id.toHexString();
});

offerSchema.set("toJSON", {
    virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("offer", offerSchema);
