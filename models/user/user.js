const mongoose = require("mongoose");

//User Schema
const userSchema = new mongoose.Schema({
  phoneNumber: {
    type: Number,
    required: true,
    min: 10,
  },
  masterPassword: {
    type: String,
    default: "",
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  bankAccountNumber: {
    type: String,
    default: "",
  },
  bankIfscCode: {
    type: String,
    default: "",
  },
  bankBranch: {
    type: String,
    default: "",
  },
  bankAccountHolderName: {
    type: String,
    default: "",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  moneyInWallet: {
    type: Number,
    default: 0,
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
