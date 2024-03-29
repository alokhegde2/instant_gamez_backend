const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

//importing dot env
require("dotenv/config");

const User = require("../../models/user/user");

const {
  userRegisterationValidation,
  mpinCreationValidation,
  userVerificationValidation,
  mpinVerificationValidation,
} = require("../../validation/user/user_validation");

const {verify,verifyAdmin} = require("../../helpers/verification");
const { default: mongoose } = require("mongoose");
const user = require("../../models/user/user");

//Register the new Admin
app.post("/register", async (req, res) => {
  const { error } = userRegisterationValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phoneNumber } = req.body;

  //Checking for phone number is already used or not

  try {
    var phoneNumberStatus = await User.findOne({
      phoneNumber: Number.parseInt(phoneNumber),
    });

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
    phoneNumber: Number.parseInt(phoneNumber),
  });

  try {
    savedAdmin = await admin.save();
    return res.status(200).json({
      status: "success",
      message: "Account created successfully! Please create mpin",
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error });
  }
});

// Making phone number verified
app.put("/verified/:phoneNumber", async (req, res) => {
  const phoneNumber = req.params.phoneNumber;

  if (phoneNumber.length !== 10) {
    return res
      .send(400)
      .json({ status: "error", message: "Invalid phone number" });
  }

  //Checking for phone number is exists  or not

  try {
    var phoneNumberStatus = await User.findOne({
      phoneNumber: Number.parseInt(phoneNumber),
    });

    if (!phoneNumberStatus) {
      return res.status(400).json({
        status: "error",
        message: "User not found! Please check the phone number",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }

  // If user exists then update the user as verified

  try {
    await User.findOneAndUpdate(
      { phoneNumber: Number.parseInt(phoneNumber) },
      { isVerified: true }
    );

    return res
      .status(200)
      .json({ status: "success", message: "User verified" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }
});

// Creating the MPIN
app.post("/mpin", async (req, res) => {
  const { error } = mpinCreationValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phoneNumber, mPin } = req.body;

  //Checking for phone number is exists  or not

  try {
    var phoneNumberStatus = await User.findOne({
      phoneNumber: Number.parseInt(phoneNumber),
    });

    if (!phoneNumberStatus) {
      return res.status(400).json({
        status: "error",
        message: "User not found! Please check the phone number",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }

  // If user Exists
  var completeMpin = phoneNumber + mPin;

  //Hashing the password
  //creating salt for hashing
  const salt = await bcrypt.genSalt(10);
  const hashedMpin = await bcrypt.hash(completeMpin, salt);

  //Adding mpin to the db
  try {
    await User.findOneAndUpdate(
      { phoneNumber: Number.parseInt(phoneNumber) },
      { masterPassword: hashedMpin }
    );

    return res
      .status(200)
      .json({ status: "success", message: "Mpin created successfully!" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }
});

// Verify User
app.post("/verify", async (req, res) => {
  const { error } = userVerificationValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phoneNumber } = req.body;

  //Checking for phone number is exists  or not

  try {
    var phoneNumberStatus = await User.findOne({
      phoneNumber: Number.parseInt(phoneNumber),
    });

    if (!phoneNumberStatus) {
      return res.status(400).json({
        status: "error",
        message: "User not found! Please check the phone number",
      });
    }

    if (!phoneNumberStatus.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "Not Verified",
      });
    }
    return res.status(200).json({ status: "success", message: "User found" });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }
});

//Verify Mpin and Login
app.post("/verify/mpin", async (req, res) => {
  const { error } = mpinVerificationValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { phoneNumber, mPin } = req.body;

  //Checking for phone number is exists  or not
  var phoneNumberStatus;
  try {
    phoneNumberStatus = await User.findOne({
      phoneNumber: Number.parseInt(phoneNumber),
    });

    if (!phoneNumberStatus) {
      return res.status(400).json({
        status: "error",
        message: "User not found! Please check the phone number",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error });
  }

  if (phoneNumberStatus.isDeleted) {
    return res
      .status(400)
      .json({ status: "error", message: "Your account is deleted!" });
  }

  // If user Exists
  var completeMpin = phoneNumber + mPin;

  //comparing two passwords one is user entered and another one is the actual password
  const validPass = await bcrypt.compare(
    completeMpin,
    phoneNumberStatus.masterPassword
  );

  //If passwords do not match
  if (!validPass) {
    return res.status(400).json({ message: "Invalid mpin" });
  }

  //importing secret password
  const secret = process.env.SECRET;

  //Creating jwt
  const token = jwt.sign(
    {
      id: phoneNumberStatus.id,
      phoneNumber: phoneNumberStatus.phoneNumber,
    },
    secret,
    { expiresIn: "7d" }
  );

  //returning succes with header auth-token
  return res
    .status(200)
    .header("auth-token", token)
    .json({ authToken: token, status: "success" });
});

//Getting user data
app.get("/:id", verify, async (req, res) => {
  const { id } = req.params;

  // Verifing user id
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    var user = await User.findById(id).select(["-masterPassword"]).populate({
      path: "wallet",
      strictPopulate: true,
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found", status: "error" });
    }

    return res.status(200).json({ status: "success", user: user });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error, status: "error" });
  }
});

// Getting all the users
app.get("/", verifyAdmin, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var users = await User.find({ isDeleted: false })
      .sort({ createdDate: "asc" })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", users: users });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error, status: "error" });
  }
});

module.exports = app;
