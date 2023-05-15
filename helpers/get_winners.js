/**
 *
 * @param {*} gameId on which you want to anounce the result
 * @param {*} resultsId on which result string you want to anounce the result
 */

const { default: mongoose } = require("mongoose");
const transactionSchema = require('../models/wallet/transaction');
const bidding = require("../models/bidding/bidding");
const result = require("../models/game/result");
const winner = require("../models/game/winner");
const Config = require('../models/admin/config');
const wallet = require("../models/wallet/wallet");
// Game result logic
// Live result example
// 145-42-198
// Single Open = 4
// Single Close = 2
// Jodi = 42
// Open Pana = 145
// Close Pana = 198
// Half Sangam Type 1 = 145-2
// Half Sangam Type 2 = 198-4
// Full Sangam = 145-198

// const getWinners = async (gameId, results, resultId) => {
//   // First get the game data using [gameId]
//   // Get the result data using [resultId]
//   //Get sigle open winning number
//   //Get Single Close winning number
//   //Get Open Pana winning number
//   //Get Close Pana winning number
//   //Get Half Sangam Type 1 winning number
//   //Get Half Sangam Type 2 winning number
//   //Get Full Sangam  winning number
//   // Get the users bided on the [gameId] between open and close time and on the result numbers
//   let getConfig = await Config.findOne();
//   let walletAmount = []
//   let winners = []
//   for (i = 0; i < results.length; i++) {
//     let getBiddings = await bidding.aggregate([
//       {
//         $match: {
//           $and: [
//             { gameId: mongoose.Types.ObjectId(gameId) },
//             { biddedCategory: results[i].cat }
//             , {
//               biddingOn: results[i].type
//             }]
//         }
//       },
//       {
//         $lookup: {
//           from: 'Users',
//           localField: 'user',
//           foreignField: '_id',
//           as: 'userData'
//         }
//       }
//     ]);
//     if (getBiddings.length > 0) {
//       for (j = 0; j < getBiddings.length; j++) {
//         if (getBiddings[j].userData.length > 0) {
//           let wonAmount = (getBiddings[j].amountBidded * getConfig[results[i].cat.trim()]) / 10
//           winners.push({
//             resultId: resultId,
//             userId: getBiddings[j].user,
//             gameId: gameId,
//             wonNumber: results[i].result,
//             wonCategory: results[i].cat,
//             wonAmount: wonAmount,
//             walletId: getBiddings[j].userData[0].wallet
//           });

//           walletAmount.push({
//             amount: wonAmount,
//             walletId: getBiddings[j].userData[0].wallet
//           });

//         }
//       }

//     }
//   }
//   await winner.insertMany(winners);
//   walletAmount.forEach(async (element) => {
//     await wallet.findByIdAndUpdate(element.walletId, { $inc: { amountInWallet: element.amount }, lastAmountAdded: Date.now() }, { new: true })
//   })
// };
const getWinners = async (gameId, results, resultId,start,end) => {
  // First get the game data using [gameId]
  // Get the result data using [resultId]
  //Get sigle open winning number
  //Get Single Close winning number
  //Get Open Pana winning number
  //Get Close Pana winning number
  //Get Half Sangam Type 1 winning number
  //Get Half Sangam Type 2 winning number
  //Get Full Sangam  winning number
  // Get the users bided on the [gameId] between open and close time and on the result numbers
  console.log('here')
  const getConfig = await Config.findOne();
  console.log(getConfig)
  console.log(gameId + "   " + resultId)
  const winners = [];
  const transaction = [];
  const walletAmount = [];

  for (const result of results) {
    console.log(result)
    console.log(result.cat + "  " + result.type + "  " + result.result)
    const getBiddings = await bidding.aggregate([
      {
        $match: {
          $and: [
            {
              game: mongoose.Types.ObjectId(gameId)
            },
            { biddedCategory: result.cat },
            {
              biddingOn: result.type
            }, { biddingNumber: result.result }
          ]
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      }
    ]);
    console.log(getBiddings)
    if (getBiddings.length > 0) {
      for (const bid of getBiddings) {
        if (bid.userData.length > 0) {
          console.log("amount ")
          console.log(bid.amountBidded + "  " + getConfig[result.cat.replace(/\s/g, '').trim()] + "" + result.cat.trim());
          const wonAmount = (bid.amountBidded * getConfig[result.cat.replace(/\s/g, '').trim()]) / 10;
          console.log(wonAmount)
          winners.push({
            resultId: resultId,
            userId: bid.user,
            gameId: gameId,
            winningCategory: result.cat,
            wonNumber: result.result,
            wonAmount: wonAmount,
            walletId: bid.userData[0].wallet
          });
          transaction.push({
            amountOfTransaction: wonAmount,
            dateOfTransaction: Date.now(),
            user: bid.user,
            typeOfTransaction: "Winning",
            wallet: bid.userData[0].wallet,
            game: gameId
          });
          walletAmount.push({
            amount: wonAmount,
            walletId: bid.userData[0].wallet
          });
        }
      }
    }
  }
  console.log(winners)
  await winner.insertMany(winners);
  await transactionSchema.insertMany(transaction)
  await Promise.all(
    walletAmount.map(async (element) => {
      await wallet.findByIdAndUpdate(element.walletId, { $inc: { gameWinning: element.amount }, lastAmountAdded: Date.now() }, { new: true })
    })
  );
  console.log('winner announced')
};

module.exports.getWinners = getWinners;
