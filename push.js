require("dotenv").config();

var mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");

const { getDateWithNoTime, getDateWithHour } = require("./utils");
const User = require("./models/userModel");

const mongoDB = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const expo = new Expo();

const pushNotifications = async () => {
  const dateWithHour = getDateWithHour();

  try {
    const users = await User.find({}).lean();
    const usersWithPushTokens = users.filter(
      (u) => u.push_token && u.push_notifications
    );

    let messages = [];

    for (const user of usersWithPushTokens) {
      for (const show of user.show_list) {
        console.log(
          "show.reminder_date.getHours()",
          show.reminder_date.getHours()
        );

        const dateMinusHours = subtractHours(
          show.reminder_date.getHours(),
          dateWithHour
        );

        const dateWithNoTime = getDateWithNoTime(dateMinusHours);
        const currentDayTimestamp = dateWithNoTime.getTime();

        console.log("currentDayTimestamp", currentDayTimestamp);
        console.log(
          "show.reminder_date timestamp",
          getDateWithNoTime(show.reminder_date).getTime()
        );

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
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
    console.log(tickets);
  } catch (err) {
    console.log(err);
  }
};

pushNotifications().finally(() => {
  process.exit();
});
