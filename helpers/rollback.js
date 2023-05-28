const { default: mongoose } = require("mongoose");
const bidding = require("../models/bidding/bidding");
const game = require("../models/game/game");
const result = require("../models/game/result");
const winner = require("../models/game/winner");
const wallet = require("../models/wallet/wallet");
const { walletDeduction } = require("./wallet_deduction");

const transactionSchema = require('../models/wallet/transaction');
exports.Rollback = async (resultId) => {
    console.log(resultId)
    const transaction = []
    const getResults = await result.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(resultId) } },
        {
            $lookup: {
                from: "winners",
                localField: "_id",
                foreignField: "resultId",
                as: "winners",
            },
        },
    ]);

    const updateResults = getResults.map(async (res) => {
        const walletDeductions = res.winners.map(async (win) => {
            try {
                transaction.push({
                    amountOfTransaction: win.wonAmount,
                    dateOfTransaction: Date.now(),
                    user: win.userId,
                    typeOfTransaction: "Rollback",
                    wallet: win.walletId, game: res.gameId
                });
                const walletDeduct = await wallet.findOneAndUpdate(
                    { _id: mongoose.Types.ObjectId(win.walletId) },
                    { $inc: { gameWinning: -win.wonAmount } },
                    { new: true }
                );
                return walletDeduct;
            } catch (error) {
                console.error(error);
            }
        });
        await transactionSchema.insertMany(transaction)
        await Promise.all(walletDeductions);
        console.log("res id " + res._id)
        return result.findByIdAndUpdate(res._id, { isRollbacked: true, rollbackedDateTime: Date.now() });
    });

    await Promise.all(updateResults);
};
exports.cancelGame = async (gameId, start, end) => {
    console.log(gameId + start + end)
    const transaction = []
    let getGame = await game.findById(gameId);
    if (getGame != undefined && getGame != null) {

        // console.log(new Date("2022-11-06T14:14:15.756+00:00"))
        // console.log(start + "  " + end)
        const getResults = await bidding.aggregate([
            {
                $match: {
                    $and: [{ game: mongoose.Types.ObjectId(gameId) },
                    { createdDate: { $gte: start } },
                    { createdDate: { $lt: end } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "usersData",
                },
            },
        ]);
        console.log(getResults)
        // console.log(getResults)
        const updateResults = getResults.map(async (res) => {
            if (res.usersData.length > 0) {
                // console.log(res)
                transaction.push({
                    amountOfTransaction: res.amountBidded,
                    dateOfTransaction: Date.now(),
                    user: res.user,
                    typeOfTransaction: "Refund",
                    wallet: res.usersData[0].wallet,
                    game: gameId
                });
                const walletIncrement = await wallet.findOneAndUpdate(
                    { _id: mongoose.Types.ObjectId(res.usersData[0].wallet) },
                    { $inc: { amountInWallet: res.amountBidded } },
                    { new: true }
                );
                return walletIncrement;

            }
        });
        await transactionSchema.insertMany(transaction)
        await Promise.all(updateResults);
        console.log("Game cancelled")
    }
    else {
        console.log("Game not find")
    }
}