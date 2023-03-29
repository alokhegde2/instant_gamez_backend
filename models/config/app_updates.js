const mongoose = require("mongoose");

//Config Schema
const appUpdateSchema = new mongoose.Schema({
  version: {
    type: Number,
    required: true,
  },
  logs: {
    type: String,
    default: "",
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

//Creating virtual id
appUpdateSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

appUpdateSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("AppUpdates", appUpdateSchema);
