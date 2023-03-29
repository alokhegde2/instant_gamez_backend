const express = require("express");
const { default: mongoose } = require("mongoose");

const { verify, verifyAdmin } = require("../../helpers/verification");
const AppUpdates = require("../../models/config/app_updates");

const app = express();

//importing dot env
require("dotenv/config");

//Route to push new app update
app.post("/update", verifyAdmin, async (req, res) => {
  const { version, log } = req.body;

  var configStatus = await AppUpdates.find({ version: version });

  if (configStatus.length > 0) {
    return res
      .status(409)
      .json({ status: "error", message: "This version is already present!" });
  }

  var appUpdate = new AppUpdates({
    version: version,
    logs: log,
  });

  try {
    await appUpdate.save();

    return res
      .status(201)
      .json({ status: "success", message: "App update pushed successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

//Getting update in the app
app.get("/update", verify, async (req, res) => {
    try {
        var updateStatus = await AppUpdates.findOne().sort('-version')

        // if(updateStatus.)
        console.log(updateStatus);
    } catch (error) {
        console.error(error);
        return res.status(500).json({"status":"error","message":"Some error occured","error":error})
    }
});

module.exports = app;
