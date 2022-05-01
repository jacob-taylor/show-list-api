require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
var mongoose = require("mongoose");

const userRoutes = require("./routes/userRouter");

const app = express();
const port = 3000;

const mongoDB = process.env.MONGO_CONNECTION_STRING;
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
app.use("/api", userRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
