const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Game = require("../../models/game/game");
const Result = require("../../models/game/result");

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
  const { name, openBidTime, closeBidTime, openDate } = req.body;

  // CREATING THE GAME DATA
  var gameData = new Game({
    name: name,
    openBiddingTime: openBidTime,
    closingBiddingTime: closeBidTime,
    openDate: openDate,
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
// It gives the all the games and only todays result

router.get("/", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  var currentDate = new Date();

  try {
    var gameData = await Game.find()
      .populate({
        path: "results",
        select: ["resultString", "anouncedDateTime"],
        strictPopulate: false,
        match: {
          anouncedDateTime: {
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
        },
        // justOne
      })
      .sort({ openBiddingTime: "asc" })
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

//GETTING CURRENT GAMES
router.get("/current", verify, async (req, res) => {
  var currentDate = new Date();

  var day = currentDate.getDay();

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      openDate: day,
      DisabledDates: {
        $not: {
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
      },
    })
      .populate({
        path: "results",
        select: ["resultString", "anouncedDateTime"],
        strictPopulate: false,
        match: {
          anouncedDateTime: {
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
        },
        // justOne
      })
      .sort({ openBiddingTime: "asc" })
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
// TODO : NOT REQUIRED
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
      .sort({ openBiddingTime: "asc" })
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
      .sort({ openBiddingTime: "asc" })
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

//GETTING COMPLETED GAME
router.get("/cancelled", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      isCancelled: true,
    })
      .sort({ openBiddingTime: "asc" })
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

//GETTING SINGLE GAME
router.get("/:id", verify, async (req, res) => {
  const { id } = req.params;

  // VERIFYING GAME ID
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Game Id" });
  }

  try {
    var gameData = await Game.findById(id);

    if (gameData === null) {
      return res
        .status(400)
        .json({ status: "error", message: "Game not found" });
    }

    //TODO: WHEN BIDDING IS STARTED GET ALSO THE TOTAL BIDS COUNT

    return res.status(200).json({ status: "success", game: gameData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

// CANCELLING GAME
router.put("/cancel/:id", verify, async (req, res) => {
  const { id } = req.params;

  // VERIFYING GAME ID
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Game Id" });
  }

  try {
    var gameData = await Game.findById(id);

    if (gameData === null) {
      return res
        .status(400)
        .json({ status: "error", message: "Game not found" });
    }
    await Game.findByIdAndUpdate(id, { isCancelled: true });

    return res
      .status(200)
      .json({ status: "success", message: "Game Cancelled Successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING COMPLETED GAME (THIS ROUTE FOR USER)
router.get("/completedUser/:userId", verify, async (req, res) => {});

// TODO: TESTING ROUTE
router.get("/results/:id", async (req, res) => {
  var gameID = req.params.id;

  try {
    var results = new Result({
      resultString: "123_**_***",
      gameId: gameID,
    });
    await results.save();

    return res.send("Success");
  } catch (error) {
    console.error(error);
    return res.send(error);
  }
});

module.exports = router;
