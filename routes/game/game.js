const express = require("express");
const app = express();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const verify = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Game = require("../../models/game/game");
const Result = require("../../models/game/result");
const User = require("../../models/user/user");
const Bidding = require("../../models/bidding/bidding");

// IMPORTING VALIDATION
const {
  gameValidation,
  biddingValidation,
} = require("../../validation/game/game_validation");
const { createTransaction } = require("../../helpers/transactions");
const { walletDeduction } = require("../../helpers/wallet_deduction");

// GAME CREATION ROUTE
app.post("/", verify, async (req, res) => {
  //VALIDATING THE RECIVED FROM THE REQUEST
  const { error } = gameValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // DATA RECIVED FROM THE REQUEST BODY
  const { name, openBidTime, closeBidTime, openDate } = req.body;

  try {
    var gameStatus = await Game.find({ name: name, isDeleted: false });

    if (gameStatus.length !== 0) {
      return res.status(400).json({ message: "Game name is already taken" });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Unable to add the game" });
  }

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

app.get("/", verify, async (req, res) => {
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
app.get("/current", verify, async (req, res) => {
  var currentDate = new Date();

  var day = currentDate.getDay();

  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    // We are getting data where deleted date is not today
    // And getting result of only today games
    var gameData = await Game.find({
      openDate: day,
      isDeleted: false,
      disabledDate: {
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
      })
      .sort({ openBiddingTime: "asc" })
      .limit(limit)
      .skip(startIndex);

    var sortedGame = [];

    //Check for close time
    gameData.forEach((element) => {
      var closeTime = new Date(element["closingBiddingTime"]);
      var currentTime = new Date();

      if (currentTime.getHours() == closeTime.getHours()) {
        if (currentTime.getMinutes() > closeTime.getMinutes()) {
          sortedGame.push(element);
        }
      } else if (currentTime.getHours() > closeTime.getHours()) {
        sortedGame.push(element);
      }
    });

    //Check for running bid
    gameData.forEach((element) => {
      var isFound = sortedGame.find((game) => game === element);
      var closeTime = new Date(element["closingBiddingTime"]);
      var openTime = new Date(element["openBiddingTime"]);
      var currentTime = new Date();
      if (!isFound) {
        if (openTime.getHours() === currentTime.getHours()) {
          if (openTime.getMinutes() < currentDate.getMinutes()) {
            sortedGame.push(element);
          }
        } else if (openTime.getHours() < currentDate.getHours()) {
          sortedGame.push(element);
        }
      }
    });

    //Check for open bid
    gameData.forEach((element) => {
      var isFound = sortedGame.find((game) => game === element);

      if (!isFound) {
        sortedGame.push(element);
      }
    });
    sortedGame.reverse();

    return res.status(200).json({ status: "success", games: sortedGame });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING DISABLED GAMES
app.get("/disabled", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  var currentDate = new Date();

  var day = currentDate.getDay();

  try {
    var gameData = await Game.find({
      openDate: day,
      isDeleted: false,
      disabledDate: {
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

//GETTING CANCELLED GAME
app.get("/cancelled", verify, async (req, res) => {
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  var currentDate = new Date();

  var day = currentDate.getDay();

  try {
    var gameData = await Game.find({
      openDate: day,
      disabledDate: {
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
app.get("/:id", verify, async (req, res) => {
  const { id } = req.params;

  var currentDate = new Date();

  // VERIFYING GAME ID
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Game Id" });
  }

  try {
    var gameData = await Game.findById(id).populate({
      path: "results",
      strictPopulate: false,
      options: { limit: 3, sort: { anouncedDateTime: "asc" } },
    });

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
app.put("/cancel/:id", verify, async (req, res) => {
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
    await Game.findByIdAndUpdate(id, { disabledDate: Date.now() });

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

/**
 * Master Sheet
 */

app.get("/master/sheet", verify, async (req, res) => {
  const day = parseInt(req.query.day);
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  try {
    var gameData = await Game.find({
      openDate: day,
      isDeleted: false,
    })
      .sort({ openBiddingTime: "asc" })
      .limit(limit)
      .skip(startIndex);

    return res
      .status(200)
      .json({ status: "success", games: gameData, day: day });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

/**
 * Delete the game
 */

app.put("/delete/:id", verify, async (req, res) => {
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
    await Game.findByIdAndUpdate(id, { isDeleted: true });

    return res
      .status(200)
      .json({ status: "success", message: "Game Deleted Successfully!" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//GETTING COMPLETED GAME (THIS ROUTE FOR USER)
app.get("/completedUser/:userId", verify, async (req, res) => {});

//Bidding on the game
app.post("/bid", verify, async (req, res) => {
  const { gameId, userId, amount, biddingCategory, biddingOn, biddingNumber } =
    req.body;

  //VALIDATING THE RECIVED FROM THE REQUEST
  const { error } = biddingValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  //check user id
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid User Id" });
  }

  //Check the game id
  if (!mongoose.isValidObjectId(gameId)) {
    return res.status(400).json({ message: "Invalid Game Id" });
  }

  // Getting user data
  var userStatus = await User.findById(userId);

  if (!userStatus) {
    return res.status(400).json({ message: "User not found" });
  }

  //Write the logic to deduct the money
  var walletDeductionStatus = await walletDeduction(
    userId,
    userStatus.wallet,
    amount
  );

  if (walletDeductionStatus["status"] === "error") {
    return res.status(400).json({ message: walletDeductionStatus["message"] });
  }

  //Doing transaction
  var transaction = await createTransaction(
    userId,
    amount,
    "GamePlay",
    userStatus.wallet,
    gameId
  );

  if (transaction["status"] === "error") {
    return res
      .status(400)
      .json({ message: "Unable to place the bid! Try again" });
  }

  //Creating bid
  var bid = new Bidding({
    user: userId,
    amountBidded: amount,
    biddedCategory: biddingCategory,
    biddingNumber: biddingNumber,
    biddingOn: biddingOn,
    createdDate: Date.now(),
  });

  // Save the bid details
  try {
    await bid.save();
    return res
      .status(200)
      .json({ message: "Bid placed successfully", status: "success" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//Bidding on the game
app.get("/bid/:userId", verify, async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page);
  const limit = parseInt(req.query.limit);

  const startIndex = (page - 1) * limit;

  //check user id
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid User Id" });
  }
  try {
    // Getting bid data
    var bids = await Bidding.find({ user: userId })
      .sort({ createdDate: -1 })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json({ status: "success", bids: bids });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

module.exports = app;
