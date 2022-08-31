const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const https = require("https");
const fs = require("fs");

const options = {
  key: fs.readFileSync("key.pem"),
  cert: fs.readFileSync("cert.pem"),
};

//importing dot env
require("dotenv/config");

//initializing api
//which is the initial route of api
const api = process.env.API_URL;

//Initializing app
const app = express();

//CORS
app.use(cors());
app.options("*", cors());

//Middlewares
//Middleware to serve static files
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(morgan("tiny"));
//Always use helmet for safety
app.use(helmet());

// ROUTE MIDDLEWARE IMPORTS
const adminRoute = require("./routes/admin/admin");

// CATEGORY MODULE
const categoryRoute = require("./routes/category/category");

// ROUTE MIDDLEWARES
app.use(`${api}/admin`, adminRoute);

// CATEGORY MODULE
app.use(`${api}/category`, categoryRoute);

//Connecting to mongodb database
mongoose
  .connect(
    process.env.DEV_DATABASE,
    // + "/instant_gamez"
    {
      useNewUrlParser: true,
    }
  )
  .then(() => {
    console.log("Database connection is ready");
  })
  .catch((err) => {
    console.error(err);
  });

//Initializing port
const port = process.env.PORT || 3000;

var server = https.createServer(options, app);

//Running server
server.listen(port, () => {
  console.log(`Server is running at port ${port} ...`);
});
