const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

//importing dot env
require("dotenv/config");

const User = require("../../models/user/user");

const {
  userRegisterationValidation,
} = require("../../validation/user/user_validation");

//Register the new Admin
app.post("/register", async (req, res) => {
  const { error } = userRegisterationValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phoneNumber } = req.body;

  //Checking for phone number is already used or not

  try {
    var phoneNumberStatus = await User.findOne({ phoneNumber: phoneNumber });

    if (phoneNumberStatus) {
      return res
        .status(409)
        .json({ status: "error", message: "Phone number already exists" });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }

  let admin = new User({
    phoneNumber: phoneNumber,
  });

  try {
    savedAdmin = await admin.save();
    return res
      .status(200)
      .json({ message: "Account created successfully! Please create mpin" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error });
  }
});

module.exports = app;
