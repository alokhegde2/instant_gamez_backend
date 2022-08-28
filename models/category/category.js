const mongoose = require("mongoose");

//Category Schema
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    min: 3,
    max: 255,
  },

  createdDate: {
    type: Date,
    default: Date.now(),
  },
});

//Creating virtual id
categorySchema.virtual("id").get(function () {
  return this._id.toHexString();
});

categorySchema.set("toJSON", {
  virtuals: true,
});

//Exporting modules
module.exports = mongoose.model("Category", categorySchema);
