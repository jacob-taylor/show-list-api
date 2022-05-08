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
    const date = getDateWithNoTime();
    const currentDayTimestamp = date.getTime();

    const users = await User.find({}).lean();
    const usersWithPushTokens = users.filter(
      (u) => u.push_token && u.push_notifications
    );

    let messages = [];

    for (const user of usersWithPushTokens) {
      for (const show of user.show_list) {
        if (
          getDateWithNoTime(show.reminder_date).getTime() ===
          currentDayTimestamp
        ) {
          // Create push message
          messages.push({
            to: user.push_token,
            body: `Don't forget to watch ${show.title} today!`,
          });
        }
      }
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }

    res.json(messages);
  } else {
    res.sendStatus(401);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
