const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

//importing dot env
require("dotenv/config");

const User = require("../../models/user/user");

const {
  registerValidation,
  loginValidation,
} = require("../../validation/admin/admin_validation");

//Register the new Admin
app.post("/register", async (req, res) => {
  let admin = new User({
    name: req.body.name,
    email: req.body.email,
  });

  try {
    savedAdmin = await admin.save();
    res.status(200).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error });
  }
});

module.exports = app;
