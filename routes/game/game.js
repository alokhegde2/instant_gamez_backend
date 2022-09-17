const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Game = require("../../models/game/game");

// IMPORTING VALIDATION
const { gameValidation } = require("../../validation/game/game_validation");

// GAME CREATION ROUTE
router.post("/", verify, async (req, res) => {
  //VALIDATING THE RECIVED FROM THE REQUEST
  const { error } = gameValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // DATA RECIVED FROM THE REQUEST BODY
  const { name, openBidTime, closeBidTime } = req.body;

  // CREATING THE GAME DATA
  var gameData = new Game({
    name: name,
    openBiddingTime: openBidTime,
    closingBiddingTime: closeBidTime,
    isCancelled: false,
    isResultAnnounced: false,
    createdDate: Date.now(),
  });

  try {
    //SAVING THE DATA

    await gameData.save();

    // IF DATA IS SAVED
    return res
      .status(200)
      .json({ status: "succes", message: "Game Created Successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Unable to add the game" });
  }
});

// GETTING ALL GAMES
router.get("/", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find().limit(limit).skip(startIndex);

    return res.status(200).json({ status: "success", games: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING CURRENT GAMES
router.get("/current", verify, async (req, res) => {
  var currentDate = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(currentDate.getDate() + 1);

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      openBiddingTime: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          00,
          00,
          00
        ),
        $lt: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          23,
          59,
          59
        ),
      },
      isCancelled: false,
      isResultAnnounced: false,
    })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", games: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING UPCOMMING GAMES
router.get("/upcoming", verify, async (req, res) => {
  var currentDate = new Date();
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      openBiddingTime: {
        $gte: new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          23,
          59,
          59
        ),
      },
      isCancelled: false,
      isResultAnnounced: false,
    })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", games: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING COMPLETED GAMES
router.get("/completed", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      isCancelled: false,
      isResultAnnounced: true,
    })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", games: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING COMPLETED GAME (THIS ROUTE FOR USER)
router.get("/cancelled", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      isCancelled: true,
    })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", games: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING COMPLETED GAME (THIS ROUTE FOR USER)
router.get("/completedUser/:userId", verify, async (req, res) => {});

module.exports = router;
