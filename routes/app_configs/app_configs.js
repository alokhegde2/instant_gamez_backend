const express = require("express");
const { default: mongoose } = require("mongoose");

const { verify, verifyAdmin } = require("../../helpers/verification");
const Config = require("../../models/admin/config");
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
    return res.status(500).json({ "status": "error", "message": "Some error occured", "error": error })
  }
});

app.post("/config", async (req, res) => {
  try {
    const configData = req.body;
    const config = await Config.findOne();
    if (!config) {
      // If no config record exists, create a new one
      const newConfig = new Config(configData);
      await newConfig.save();
      return res
        .status(200)
        .json({ status: "success", config: newConfig });
    } else {
      // If config record exists, update the first document and return it
      config.set(configData);
      await config.save();
      return res
        .status(200)
        .json({ status: "success", config: config });
    }
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: err });
  }
});
app.get("/config", async (req, res) => {
  try {
    var getConfig = await Config.findOne();
    return res
      .status(200)
      .json({ status: "success", config: getConfig });

  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});
module.exports = app;
