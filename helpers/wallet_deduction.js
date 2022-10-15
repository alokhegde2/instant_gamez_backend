const Wallet = require("../models/wallet/wallet");

const walletDeduction = async (userId, walletId, deductionAmount) => {
  try {
    //Check if the money is there in wallet
    var wallet = await Wallet.findById(walletId);

    if (!wallet) {
      return { status: "error", message: "Wallet not found!" };
    }

    var availableBalance = wallet.amountInWallet;

    if (availableBalance < 10) {
      return { status: "error", message: "Wallet balance is below 10 rupees" };
    }

    if (deductionAmount < 10) {
      return {
        status: "error",
        message: "Amount should be greater than or equal to 10 rupees",
      };
    }

    if (deductionAmount > availableBalance) {
      return {
        status: "error",
        message: "You didn't have balance in wallet to do this transaction",
      };
    }

    var remainingWalletAmount = availableBalance - parseInt(deductionAmount);

    console.log(remainingWalletAmount);

    var walletDeduction = await Wallet.findByIdAndUpdate(walletId, {
      amountInWallet: remainingWalletAmount,
    });

    return { status: "success" };
  } catch (error) {
    console.error(error);
    return { status: "error", message: "Some unknown error occured!" };
  }
};

module.exports.walletDeduction = walletDeduction;
