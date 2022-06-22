require("dotenv").config();

var mongoose = require("mongoose");
const { Expo } = require("expo-server-sdk");

const User = require("./models/userModel");

const mongoDB = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });

//Get the default connection
const db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const expo = new Expo();

exports.sendPushNotification = async (userId, showId) => {
  try {
    const user = await User.findById(userId);
    const show = await user.show_list.find((s) => s._id.equals(showId));

    let messages = [];

    if (user.push_token) {
      // Create push message
      messages.push({
        to: user.push_token,
        body: `Don't forget to watch ${show.title} today!`,
      });
    }

    if (messages.length > 0) {
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
    }
  } catch (err) {
    console.log(err);
  }
};
