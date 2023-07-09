const { default: mongoose } = require("mongoose");
const bidding = require("../models/bidding/bidding");
const game = require("../models/game/game");
const result = require("../models/game/result");
const winner = require("../models/game/winner");
const wallet = require("../models/wallet/wallet");
const { walletDeduction } = require("./wallet_deduction");

const transactionSchema = require('../models/wallet/transaction');
const resultAnalytic = require("../models/game/resultAnalytic");
exports.Rollback = async (resultId, type) => {
    let winnerselect = []
    if (type == 1) {
        winnerselect = [0, 2]
    }
    else {
        winnerselect = [1, 2]
    }
    console.log('winner select' + winnerselect)
    console.log(resultId)
    const transaction = []
    const getResults = await result.aggregate([
        { $match: { _id: mongoose.Types.ObjectId(resultId) } },
        {
            $lookup: {
                from: "winners",
                let: { result_id: "$_id" },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ["$resultId", "$$result_id"] },
                            isRollback: false,
                            resultConnect: { $in: winnerselect }
                        }
                    }
                ],
                as: "winners",
            },
        }
    ]);
    let winnerId = [];
    console.log(getResults[0].winners)
    const updateResults = getResults.map(async (res) => {
        const walletDeductions = res.winners.map(async (win) => {
            try {
                winnerId.push(mongoose.Types.ObjectId(win._id))
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
                await bidding.findByIdAndUpdate(win.bidId, { isWinner: 0 }, { new: true })
                return walletDeduct;
            } catch (error) {
                console.error(error);
            }
        });
        await transactionSchema.insertMany(transaction)
        await Promise.all(walletDeductions);
        console.log("res id " + res._id)
        let resultString = (type == 2
            ? `${res.resultString.slice(0, 5)}*-***`
            : `***-*${res.resultString.slice(res.resultString.length - 5, res.resultString.length)}`)
        // console.log(resultString)
        if (resultString == "***-**-***") {
            await result.findByIdAndUpdate(resultId, { isRollbacked: true, rollbackedDateTime: Date.now() });
        }
        else {
            console.log(resultString)
            await result.findByIdAndUpdate(resultId, { resultString: resultString });
        }
        let getResultId = await resultAnalytic.findOne({ resultId: mongoose.Types.ObjectId(resultId) })
        console.log(getResultId)
        let getReset = await bidding.updateMany({ _id: { $in: getResultId.bidding } }, { isWinner: 0 }, { new: true })
        console.log(getReset)
        return
    });
    await winner.updateMany({ _id: { $in: winnerId } }, { isRollback: true });
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
                await bidding.findByIdAndUpdate(
                    res._id,
                    { isWinner: 4 },
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