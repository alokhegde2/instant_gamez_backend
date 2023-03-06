const express = require("express");
const mongoose = require("mongoose");

const app = express();

// IMPORTING VERIFICATION MIDDLEWARE
const {verify} = require("../../helpers/verification");

//importing dot env
require("dotenv/config");

const User = require("../../models/user/user");
const Admin = require("../../models/admin/admin");
const Category = require("../../models/category/category");
const Game = require("../../models/game/game");
const Result = require("../../models/game/result");
const Winner = require("../../models/game/winner");

app.delete("/user", verify, async (req, res) => {
  try {
    await User.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Users Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

app.delete("/admin", verify, async (req, res) => {
  try {
    await Admin.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Admin Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

app.delete("/category", verify, async (req, res) => {
  try {
    await Category.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Category Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

app.delete("/game", verify, async (req, res) => {
  try {
    await Game.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Games Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

app.delete("/result", verify, async (req, res) => {
  try {
    await Result.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Results Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

app.delete("/winner", verify, async (req, res) => {
  try {
    await Winner.deleteMany({});
    return res
      .status(200)
      .json({ status: "success", message: "Winners Deleted Successfully" });
  } catch (error) {
    console.error(error);
    return res.status(200).json({ status: "error", error: error });
  }
});

module.exports = app;
