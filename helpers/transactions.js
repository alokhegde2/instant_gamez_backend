const Transactions = require("../models/wallet/transaction");

const createTransaction = async (userId, amount, type, walletId, gameId) => {
  try {
    var transaction;
    if (type === "Deposit") {
      transaction = new Transactions({
        amountOfTransaction: amount,
        dateOfTransaction: Date.now(),
        user: userId,
        typeOfTransaction: type,
        wallet: walletId,
      });
    } else {
      transaction = new Transactions({
        amountOfTransaction: amount,
        dateOfTransaction: Date.now(),
        user: userId,
        game: gameId,
        typeOfTransaction: type,
        wallet: walletId,
      });
    }

    await transaction.save();

    return { status: "success" };
  } catch (error) {
    console.error(error);
    return { status: "error" };
  }
};

module.exports.createTransaction = createTransaction;
