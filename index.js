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

//Initializing app
const app = express();

var server = https.createServer(options, app);
const socketIO = require("socket.io")(server);

//importing dot env
require("dotenv/config");

//initializing api
//which is the initial route of api
const api = process.env.API_URL;

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

// GAME MODULE
const gameRoute = require("./routes/game/game");

// USER MODULE
const userRoute = require("./routes/user/user");

// WALLET MODULE
const walletRoute = require("./routes/wallet/wallet");

// TRANSACTION MODULE
const transactionRoute = require("./routes/wallet/transaction");

// Config Module
const configRoute = require("./routes/app_configs/app_configs");

// TRUNCATE MODULE
const truncateRoute = require("./routes/others/truncate_db");

// TODO: TESTING MODULE OF THE CHAT

// ROUTE MIDDLEWARES
app.use(`${api}/admin`, adminRoute);

// CATEGORY MODULE
app.use(`${api}/category`, categoryRoute);

// GAME MODULE
app.use(`${api}/game`, gameRoute);

// USER MODULE
app.use(`${api}/user`, userRoute);

// WALLET MODULE
app.use(`${api}/wallet`, walletRoute);

// TRANSACTION MODULE
app.use(`${api}/transaction`, transactionRoute);

// Config Module
app.use(`${api}/config`, configRoute);

// TRUCATING MODULE
app.use(`${api}/truncate`, truncateRoute);

// TODO: TESTING MODULE OF THE CHAT
socketIO.on("connection", (socket) => {
  // ON CONNECTION OF THE USER
  // THE USER ID SHOULD BE SENT THROUGH THE QUERY AS "id"
  // ADD THE USER SOCKET ID AND CURRENT ACCESS TIME AND IS ONLINE STATUS
  // IN USER SIDE THERE IS A CHAT OPTION ONLY BETWEEN THE ADMIN SO ONCE CONNECTION DO ANOTHER REQUEST TO GET ALL OLD CHATS

  // TODO : WRITE A FUNCTION TO STORE THE DATA IN TO THE DATABASE
  // console.log(socket.handshake.query.isAdmin, socket.id);

  // SEND ISADMIN STATUS IN THE QUERY STRING
  // IF IT'S ADMIN FOR OTHER CHANGE THE STATUS
  if (socket.handshake.query.isAdmin === "true") {
    socket.broadcast.emit(
      "adminStatus",
      JSON.stringify({ isAdminOnline: true, adminSocketId: socket.id })
    );
  }
  // ONCE USER GOT CONNECTED JUST ACCESS THIS POINT TO GET ALL THE OLD MESSAGE
  // ONLY SEND THE LIMITED MESSAGE THROUGH THIS POINT
  // TODO : NEEDS SOME PLAN ON GETTING THE DATA, FOR NOW I'M THINKING LIKE THIS ROUTE IS NOT NEEDED HERE
  socket.on("getMessageUser", (data) => {});

  socket.on("message", (data) => {
    // GETTING THE DATA FROM THE CLIENT
    // PARSING THE DATA TO JSON FORMAT
    var newData = JSON.parse(data);
    // GET THE ADMIN SOCKET ID FROM THE data
    var toSocket = newData["toSocketId"];
    console.log(newData["name"], socket.id);
    // THIS EVENT FOR GETTING ALL USER LIST ON THE LATEST ON FIRST
    // THIS WILL BE EMITTED ONLY TO THE ADMIN
    // OTHERS WILL NOT BE LISTENING FOR THIS EVENT
    // TAKE THE ID VERIFY THE LISTENING USER IS THE ADMIN OR NOT
    //TODO : WRITE A FUNCTION WHICH WILL GIVE
    socketIO.to(toSocket).emit(
      "allUsersMessages",
      JSON.stringify({
        fromSocket: socket.id,
        toSocket: toSocket,
        message: newData["message"],
      })
    );

    // THIS EVENT FOR THE ONE TO ONE CHAT MESSAGE
    // THIS WILL EMIT THE MESSAGE TO THE ADMIN WHEN THE USER MESSAGES HIM/HER
    socketIO.to(toSocket).emit(
      "newMessage",
      JSON.stringify({
        fromSocket: socket.id,
        toSocket: toSocket,
        message: newData["message"],
      })
    );
  });
});

// Connecting to mongodb database
mongoose
  .connect(
    process.env.DEV_DATABASE,
    // + "/instant_gamez",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

//Running server
app.listen(port, () => {
  console.log(`Server is running at port ${port} ...`);
});
