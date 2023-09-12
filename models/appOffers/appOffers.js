const mongoose = require("mongoose");

//User Schema
const appOfferSchema = new mongoose.Schema({
  offerName: {
    type: String,
    required: true,
  },
  offerDescription: {
    type: String,
    required: false,
    default: "",
  },
  amountsToAdd: {
    type: Number,
    required: false,
    default: 0,
  },
  targetPlace: {
    type: String,
    required: false,
  },
  // bannerImage: {
  //   type: String,
  //   required: false,
  // },
  isDeleted: {
    type: Boolean,
    required: false,
    default: false,
  },
  createdOn: {
    type: Date,
    required: false,
    default: Date.now(),
  },
});

//Creating virtual id
appOfferSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

appOfferSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("appOffer", appOfferSchema);
