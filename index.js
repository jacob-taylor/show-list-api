require("dotenv").config();
const bodyParser = require("body-parser");
const express = require("express");
const { Expo } = require("expo-server-sdk");
var mongoose = require("mongoose");

const userRoutes = require("./routes/userRouter");
const User = require("./models/userModel");
const { getDateWithNoTime } = require("./utils");

const PUSH_SECRET = process.env.PUSH_SECRET;

const app = express();
const port = process.env.PORT || 80;

const mongoDB = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const expo = new Expo();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(bodyParser.json());
app.use("/api", userRoutes);

app.get("/push", async (req, res) => {
  const [bearer, pushSecret] = req.headers.authorization.split(" ");

  if (PUSH_SECRET === pushSecret) {
    const users = await User.find({}).lean();
    const usersWithPushTokens = users.filter(
      (u) => u.push_token && u.push_notifications
    );

    // // Push Token identifies the device with the Expo App installed
    // const pushToken = "ExponentPushToken[zDJUxbDajadxbnz5bk7Yv2]";
    // // Conditional makes sure the pushToken is formatted properly
    // if (Expo.isExpoPushToken(pushToken)) {
    //   // Message data that is going to be sent to the phone
    //   const message = {
    //     to: pushToken,
    //     sound: "default",
    //     body: "Dr Strange - In Theatres May 5th",
    //     data: { withSome: "data" },
    //   };
    //   // Send the notification to the phone
    //   expo.sendPushNotificationsAsync([message]);
    // }
    const date = getDateWithNoTime();
    const timeStamp = date.getTime();

    const reminderDate = new Date(
      Date.parse(usersWithPushTokens[0].show_list[0].reminder_date)
    );
    const reminderTimestamp =
      reminderDate.getTime() - reminderDate.getTimezoneOffset() * 60000;

    res.json({
      serverTimestamp: timeStamp,
      savedTimeStampToUTC: reminderTimestamp,
      reminderDate,
    });
  } else {
    res.sendStatus(401);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
