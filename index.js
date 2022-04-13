require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const port = 3000;
const User = require("./models/userModel");
//Import the mongoose module
var mongoose = require("mongoose");

//Set up default mongoose connection
var mongoDB = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/users", (req, res) => {
  const user = new User();
  user.email = req.body.email;
  user.password_hash = req.body.password_hash;
  user.save((error) => {
    if (error) {
      console.log(error);
    }
    res.json({ user });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
