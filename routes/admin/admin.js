const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//importing dot env
require("dotenv/config");

const Admin = require("../../models/admin/admin");

const {
  registerValidation,
  loginValidation,
} = require("../../validation/admin/admin_validation");

//Register the new Admin
router.post("/register", async (req, res) => {
  //Validating the data before creating the Admin

  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //Checking if email is already exist in the database
  const emailExist = await Admin.findOne({ email: req.body.email });

  if (emailExist) {
    return res.status(400).json({ message: "Email already exist" });
  }

  //Hashing the password
  //creating salt for hashing
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);

  //reciving all data in body

  let admin = new Admin({
    name: req.body.name,
    email: req.body.email,
    hashedPassword: hashPassword,
  });

  try {
    savedAdmin = await admin.save();
    res.status(200).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error });
  }
});

//All routes goes here
router.post("/login", async (req, res) => {
  //Validating user details
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //Finding that email id is present or not
  const user = await Admin.findOne({ email: req.body.email });

  //if user not found
  if (!user) {
    return res.status(400).json({ message: "Email not found" });
  }

  //comparing two passwords one is user entered and another one is the actual password
  const validPass = await bcrypt.compare(
    req.body.password,
    user.hashedPassword
  );

  //If passwords do not match
  if (!validPass) {
    return res.status(400).json({ message: "Invalid password" });
  }

  //importing secret password
  const secret = process.env.SECRET;

  //Creating jwt
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    secret,
    { expiresIn: "7d" }
  );

  //returning succes with header auth-token
  return res.status(200).header("auth-token", token).json({ authToken: token });
});

module.exports = router;
