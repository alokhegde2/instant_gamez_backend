const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// IMPORTING VERIFICATION MIDDLEWARE
const {verify} = require("../../helpers/verification");

//IMPORTING DOT ENV
require("dotenv/config");

//IMPORTING MODEL
const Category = require("../../models/category/category");

// IMPORTING VALIDATION
const {
  categoryValidation,
} = require("../../validation/category/category_validation");

// CATEGORY CREATION ROUTE
router.post("/", verify, async (req, res) => {
  //VALIDATING THE RECIVED FROM THE REQUEST
  const { error } = categoryValidation(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  // DATA RECIVED FROM THE REQUEST BODY
  const { name, digits } = req.body;

  // CREATING THE CATEGORY DATA
  var categoryData = new Category({
    name: name,
    digits: digits,
  });

  try {
    //SAVING THE DATA

    await categoryData.save();

    // IF DATA IS SAVED
    return res
      .status(200)
      .json({ status: "succes", message: "Category Created Successfully" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Unable to add the category" });
  }
});

// GETTING THE ALL THE CATEGORIES
router.get("/", verify, async (req, res) => {
  // GET THE ALL THE CATEGORIUES FROM THE DB AND SEND

  try {
    var categoryData = await Category.find();

    // IF THERE IS NO CATEGORY
    if (categoryData.length === 0) {
      return res.status(200).json({
        status: "no-data",
        message: "No Category To Show",
        categories: categoryData,
      });
    }

    // RETURN THE DATA6
    return res
      .status(200)
      .json({ status: "success", categories: categoryData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

// GETTING THE SINGLE THE CATEGORY
router.get("/:id", verify, async (req, res) => {
  //DATA FROM THE REQUEST PARAMETER
  const { id } = req.params;

  // CHECKING IF THE ID IS PROPER OR NOT
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Course Id" });
  }

  // GET THE CATEGORY FROM THE DB AND SEND

  try {
    var categoryData = await Category.findById(id);

    // IF THERE IS NO CATEGORY
    if (categoryData.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No category to show",
      });
    }

    // RETURN THE DATA
    return res.status(200).json({ status: "success", category: categoryData });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ status: "error", message: "Some error occured", error: error });
  }
});

// EXPORTING THE MODULE
module.exports = router;
