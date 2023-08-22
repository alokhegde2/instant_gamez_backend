const express = require("express");
const app = express();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const { verify, verifyAdmin } = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const AppOffers = require("../../models/appOffers/appOffers");

//Creating new offer
app.post("/", verify, async (req, res) => {
  const { offerName, offerDescription, amountToAdd, bannerImage, targetPlace } =
    req.body;

  try {
    var offerData = new AppOffers({
      amountsToAdd: amountToAdd,
      offerDescription: offerDescription,
      bannerImage: bannerImage,
      offerName: offerName,
      targetPlace: targetPlace,
    });

    await offerData.save();

    return res
      .status(200)
      .json({
        status: "succes",
        message: "Offer Created Successfully",
        offer: offerData,
      });
  } catch (error) {}
});

module.exports = app;
