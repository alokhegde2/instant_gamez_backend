const express = require("express");
const app = express();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const { verify, verifyAdmin } = require("../../helpers/verification");

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
const winner = require("../../models/game/winner");
const { getWinners } = require("../../helpers/get_winners");
const { Rollback, cancelGame } = require("../../helpers/rollback");
const gameTrack = require("../../models/game/gameTrack");
const result = require("../../models/game/result");

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
//TODO: Add verify
app.get("/", async (req, res) => {
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
          isRollbacked: false
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
        match: {
          isRollbacked: false // add this condition
        }
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
          isRollbacked: false // add this condition
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
//TODO: Add verify
app.get("/:id", async (req, res) => {
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
      match: {
        isRollbacked: false // add this condition
      },
      options: { limit: 3, sort: { anouncedDateTime: "asc" } }
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
app.post("/cancel", verify, async (req, res) => {
  const { id, date } = req.body;

  // VERIFYING GAME ID
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Game Id" });
  }

  try {
    console.log(id)

    const givenDate = new Date(date); // Note the YYYY-MM-DD format
    start = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 0, 0, 0);
    end = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 23, 59, 59);
    // var gameData = await Game.findById(id);

    // if (gameData === null) {
    //   return res
    //     .status(400)
    //     .json({ status: "error", message: "Game not found" });
    // }
    let findResult = await Result.findById(id);
    if (findResult != undefined && findResult != null) {
      await cancelGame(findResult.gameId, start, end)
      findResult.isCancelled = true;
      await findResult.save();
      return res
        .status(200)
        .json({ status: "success", message: "Game Cancelled Successfully!" });
    }
    return res
      .status(200)
      .json({ status: "error", message: "Game cannot cance!" });

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
app.get("/completedUser/:userId", verify, async (req, res) => { });

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
    game: gameId,
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
      .populate({
        path: "game",
        strictPopulate: false,
      })
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

//Getting anounced results (admin)
app.get("/results", verifyAdmin, async (req, res) => {
  //Check if the result documents for the games which are running today are created or not
  //if documents are not created
  //Get the games which are running today
  //Create a results document for all the games which are running today
  // return the created document back to the user as response and expand the game id
});

//Anouncing results

app.post("/result_old", verifyAdmin, async (req, res) => {
  //Data from body
  const {
    resultId,
    gameId,
    resultString,
    resultType, //this should be open or close
  } = req.body;

  /*Create the result string
    1. Get the result string by gettting the result document usinf resultId
    2. Check if the result for [resultType] is anounced or not, if not
    3. If [resultType]=open then append 4 charecter at first
    4. If [resultType]=close then append 4 charecter at last
  */

  const getResult = await Result.findOne({ gameId: mongoose.Types.ObjectId(gameId), isRollbacked: false });
  if (getResult != undefined && getResult != null) {

  }
  let createNew = new Result({
    gameId: gameId,

  })
  // Update the document with proper result string

  // Once complete result is anounced get the winners

  // Return the response
});
app.post("/result", verifyAdmin, async (req, res) => {
  try {
    const { gameId, resultId, resultString, start, end } = req.body;
    if (!mongoose.isValidObjectId(gameId)) {
      return res.status(400).json({ message: "Invalid Game Id" });
    }
    if (!/^[0-9*]{3}-[0-9*]{2}-[0-9*]{3}$/.test(resultString)) {

      return res.status(400).json({ message: "Invalid Result String" });
    }

    // Find the latest result for the game that has not been rolled back
    let result = await Result.findOne({ _id: new mongoose.Types.ObjectId(resultId) }).sort({ anouncedDateTime: -1 });
    console.log(result)
    if (result) {
      console.log("result created")
      if (result.resultString == resultString) {
        return res.status(304).json({ message: "result is not changed" });
      }
      result.resultString = resultString;
      result = await result.save();
    } else {
      console.log("result not created")
      // If there is no existing result, create a new result
      result = new Result({
        gameId,
        resultString: resultString,
      });

      // Save the new result
      result = await result.save();

      let updateResult = await Game.findByIdAndUpdate(gameId, { $push: { results: result._id } }, { new: true })
    }

    const resultCategory = parseMainString(resultString);

    // Call getWinners in the background
    Promise.all([getWinners(gameId, resultCategory, result._id, start, end)]);

    return res.status(200).json({ status: "success", result: result });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occurred", error: err });
  }
});

app.post("/rollback", verifyAdmin, async (req, res) => {
  try {
    const { resultId } = req.body;
    if (!mongoose.isValidObjectId(resultId)) {
      return res.status(400).json({ message: "Invalid Game Id" });
    }

    let rollbackIs = Promise.all([Rollback(resultId)]);

    return res.status(200).json({ status: "success", result: rollbackIs });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occurred", error: err });
  }
});
app.get("/lastRollback/:id", verifyAdmin, async (req, res) => {
  const { gameId } = req.body;

  let rollbackIs = Promise.all([Rollback(gameId)]);

  return res.status(200).json({ status: "success", result: rollbackIs });

});
app.get("/results/getGames", verifyAdmin, async (req, res) => {
  try {
    // // get the current date and time
    // const currentDate = new Date();

    // // calculate the start and end dates for the current week (Monday to Saturday)
    // const startOfWeek = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 1));
    // const endOfWeek = new Date(startOfWeek.getTime() + (6 * 24 * 60 * 60 * 1000));

    // // loop over the days from Monday to Saturday
    // for (let i = 0; i <= 6; i++) {
    //   // calculate the date for the current day
    //   const date = new Date(startOfWeek.getTime() + ((i - 1) * 24 * 60 * 60 * 1000));
    //   console.log(date)
    //   const getDateGames = await Game.find({ openDate: date.getDay() });
    //   for (let j = 0; j < getDateGames.length; j++) {
    //     const oldGame = getDateGames[j];
    //     // calculate the new openBiddingTime and closingBiddingTime values for the current day
    //     const openTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), oldGame.openBiddingTime.getHours(), oldGame.openBiddingTime.getMinutes(), oldGame.openBiddingTime.getSeconds());
    //     const closeTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), oldGame.closingBiddingTime.getHours(), oldGame.closingBiddingTime.getMinutes(), oldGame.closingBiddingTime.getSeconds());
    //     console.log(openTime + " " + closeTime)
    //     // update the game record for the current day
    //     await Game.findByIdAndUpdate(
    //       oldGame._id,
    //       { $set: { openBiddingTime: openTime, closingBiddingTime: closeTime } }
    //     );
    //   }
    // }


    // console.log('here')
    // return;

    const { date } = req.query;
    let start, end;
    if (date) {
      // Use the given date
      const givenDate = new Date(date); // Note the YYYY-MM-DD format
      start = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 0, 0, 0);
      end = new Date(givenDate.getFullYear(), givenDate.getMonth(), givenDate.getDate(), 23, 59, 59);
    } else {
      // Use today by default
      const today = new Date();
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
      end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    }
    console.log(start + "  " + end)
    const gameIds = await gameTrack.find({ date: { $gte: start, $lte: end } }).distinct('gameId')
    // const gameResults = await Game.find({

    // }).populate({
    //   path: "results",
    //   match: { isRollbacked: false },
    // });
    console.log(gameIds)
    const gameResults = await Game.aggregate([
      { $match: { _id: { $in: gameIds } } },
      {
        $lookup: {
          from: "results",
          let: { gameId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$gameId", "$$gameId"] },
                    { $gte: ["$anouncedDateTime", start] },
                    { $lte: ["$anouncedDateTime", end] },
                    { $eq: ["$isRollbacked", false] }
                  ]
                }
              }
            }
          ],
          as: "results"
        }
      }
    ]);

    console.log(gameIds)
    console.log(gameResults)
    const gameIdsWithoutResults = gameResults.filter(game => game.results.length === 0).map(game => { return { id: game._id, date: game.closingBiddingTime } });

    // Games without results
    console.log(gameIdsWithoutResults)
    await Promise.all(gameIdsWithoutResults.map(async (gameId) => {
      const newResult = new Result({
        anouncedDateTime: gameId.date,
        resultString: "***-**-***",
        gameId: gameId.id,
      });
      await newResult.save();
      await Game.findByIdAndUpdate(gameId.id, { $push: { results: newResult._id } });
    }));
    // const newResults = gameIdsWithoutResults.map((gameId) => ({
    //   anouncedDateTime: gameId.date,
    //   resultString: "***-**-***",
    //   gameId: gameId.id,
    // }));
    // console.log(newResults);
    // if (newResults.length > 0) {
    //   await Result.insertMany(newResults);
    // }
    // const gameQuery = {
    //   _id: { $in: gameIds },

    //   // openBiddingTime: { $gte: start },
    //   // closeBiddingTime: { $lte: end }
    // };
    // // const gameResults = await Game.find(gameQuery).populate('results');
    // const finalResult = await Game.find(gameQuery).populate({
    //   path: "results",
    //   match: { anouncedDateTime: { $gte: start, $lte: end }, isRollbacked: false },
    // });
    const gameQuery = {
      _id: { $in: gameIds }
    };

    const finalResult = await Game.aggregate([
      { $match: gameQuery },
      {
        $lookup: {
          from: "results",
          let: { gameId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$gameId", "$$gameId"] },
                    { $gte: ["$anouncedDateTime", start] },
                    { $lte: ["$anouncedDateTime", end] },
                    { $eq: ["$isRollbacked", false] }
                  ]
                }
              }
            },
            {
              $addFields: {
                id: "$_id"
              }
            },
            {
              $project: {
                _id: 0,
                __v: 0
              }
            }
          ],
          as: "results"
        }
      },
      {
        // Add a new field 'openBiddingTimeGmt530' with the converted time
        $addFields: {
          // Add a new field called formattedDate that is the formatted string of createdAt
          openBiddingTimeGmt530: {
            // Use $concat to join multiple strings
            $concat: [
              // Use $dateToString to get the hour and minute
              {
                $dateToString: {
                  date: "$openBiddingTime",
                  // The format string specifies how to display the hour and minute
                  // %I is the hour in 12-hour clock, %M is the minute
                  format: "%H:%M",
                  // The timezone specifies the offset from UTC
                  // Indian Standard Time is UTC+05:30
                  timezone: "+05:30"
                }
              },
              // Add a space between the time and AM/PM
              " ",
              // Use $cond to check if the hour is less than 12
              {
                $cond: [
                  {
                    $lt: [
                      // Use $hour to get the hour part of the date
                      { $hour: { date: "$openBiddingTime", timezone: "+05:30" } },
                      12
                    ]
                  },
                  // If true, append "AM"
                  "AM",
                  // If false, append "PM"
                  "PM"
                ]
              }
            ]
          }
          ,
          closingBiddingTimeGmt530: {
            // Use $concat to join multiple strings
            $concat: [
              // Use $dateToString to get the hour and minute
              {
                $dateToString: {
                  date: "$closingBiddingTime",
                  // The format string specifies how to display the hour and minute
                  // %I is the hour in 12-hour clock, %M is the minute
                  format: "%H:%M",
                  // The timezone specifies the offset from UTC
                  // Indian Standard Time is UTC+05:30
                  timezone: "+05:30"
                }
              },
              // Add a space between the time and AM/PM
              " ",
              // Use $cond to check if the hour is less than 12
              {
                $cond: [
                  {
                    $lt: [
                      // Use $hour to get the hour part of the date
                      { $hour: { date: "$openBiddingTime", timezone: "+05:30" } },
                      12
                    ]
                  },
                  // If true, append "AM"
                  "AM",
                  // If false, append "PM"
                  "PM"
                ]
              }
            ]
          }
        }
      },
      {
        $addFields: {
          id: "$_id"
        }
      },
      {
        $project: {
          _id: 0,
          __v: 0
        }
      }
    ]);

    return res.status(200).json({ status: "success", start: start, end: end, result: finalResult });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occurred", error: err });
  }
});
function parseMainString(mainString) {
  console.log(mainString)
  const [open, middle, close] = mainString.split("-");
  const halfSangam1 = `${open}-${middle.charAt(1)}`;
  const halfSangam2 = `${close}-${middle.charAt(0)}`;
  const fullSangam = `${open}-${close}`;
  return [
    {
      cat: 'Single',
      type: 'Open',
      result: middle.charAt(0)
    },
    {
      cat: 'Single',
      type: 'Close',
      result: middle.charAt(1)
    },
    {
      cat: 'Jodi',
      type: 'Open',
      result: middle
    },
    {
      cat: 'Single Pana',
      type: 'Open',
      result: open
    },
    {
      cat: 'Single Pana',
      type: 'Close',
      result: close
    },
    {
      cat: 'Double Pana',
      type: 'Open',
      result: open
    },
    {
      cat: 'Double Pana',
      type: 'Close',
      result: close
    },
    {
      cat: 'Triple Pana',
      type: 'Open',
      result: open
    },
    {
      cat: 'Triple Pana',
      type: 'Close',
      result: close
    },
    {
      cat: 'Half Sangam',
      type: 'Open',
      result: halfSangam1
    },
    {
      cat: 'Half Sangam',
      type: 'Close',
      result: halfSangam2
    },
    {
      cat: 'Full Sangam',
      type: 'Open',
      result: fullSangam
    }];

  //rollback previous winner

}


module.exports = app;
