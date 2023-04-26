const mongoose = require("mongoose");

//User Schema
const adminSchema = new mongoose.Schema({
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
  hashedPassword: {
    type: String,
    required: true,
  },
  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
adminSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

adminSchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Admin", adminSchema);
