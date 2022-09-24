const mongoose = require("mongoose");

//User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },
  email: {
    type: String,
    required: true,
    min: 5,
    max: 50,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
userSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

userSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Users", userSchema);
