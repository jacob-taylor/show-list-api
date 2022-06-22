require("dotenv").config();
const schedule = require("node-schedule");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");
const { sendPushNotification } = require("../push");

const jwtSecret = process.env.JWT_SECRET;

exports.index = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");
    const data = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ email: data.email });

    res.json({ show_list: user.show_list });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      res.status(400).send({ error });
    }
  }
};

exports.add = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { show } = req.body;

    if (!show) {
      return res.status(400).send({ error: "No show was added" });
    }
    const tokenData = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ email: tokenData.email });

    // Gets the last index of the media_type list for order
    const order = user.show_list.filter(
      (s) => s.media_type === show.media_type
    ).length;

    await user.show_list.push({ ...show, order });
    await user.save();

    const newShow = user.show_list.find(
      (s) => s.id.toString() === show.id.toString()
    );

    res.status(200).send({ show: newShow });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      res.status(400).send({ error: error?.message });
    }
  }
};

exports.remove = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { show } = req.body;

    const tokenData = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ email: tokenData.email });

    const showToRemove = user.show_list.find((s) => s._id.equals(show._id));

    if (showToRemove) {
      await user.show_list.pull({ _id: showToRemove._id });
      await user.save();

      res.status(200).send({ msg: "Show removed", id: show.id });
    } else {
      res.status(400).send({ error: `Show ${show.id} does not exist` });
    }
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      console.log(error.message);
      res.status(400).send({ error: error.message });
    }
  }
};

exports.edit = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { show } = req.body;

    const tokenData = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ _id: tokenData.id });

    const showToEdit = user.show_list.find((s) => s._id.equals(show._id));

    if (showToEdit) {
      await User.updateOne(
        { _id: tokenData.id },
        {
          $set: {
            "show_list.$[s].favorited": show.favorited,
            "show_list.$[s].watched": show.watched,
            "show_list.$[s].rating": show.rating,
          },
        },
        {
          arrayFilters: [{ "s._id": showToEdit._id }],
        }
      );
      const editedUser = await User.findOne({ _id: tokenData.id });

      const editedShow = editedUser.show_list.find((s) =>
        s._id.equals(showToEdit._id)
      );

      res.status(200).send({ show: editedShow });
    } else {
      res.status(400).send({ error: `Show ${show._id} does not exist` });
    }
  } catch (error) {
    console.log(error);
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      console.log(error.message);
      res.status(400).send({ error: error.message });
    }
  }
};

exports.editReminder = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { show } = req.body;

    const tokenData = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ _id: tokenData.id });

    const showToEdit = user.show_list.find((s) => s._id.equals(show._id));

    if (showToEdit) {
      await User.updateOne(
        { _id: tokenData.id },
        {
          $set: {
            "show_list.$[s].reminder_date": show.reminder_date,
          },
        },
        {
          arrayFilters: [{ "s._id": showToEdit._id }],
        }
      );

      // Schedules push notification
      schedule.scheduleJob(
        new Date(show.reminder_date),
        sendPushNotification.bind(null, user._id, show._id)
      );

      const editedUser = await User.findOne({ _id: tokenData.id });

      const editedShow = editedUser.show_list.find((s) =>
        s._id.equals(showToEdit._id)
      );

      res.status(200).send({ show: editedShow });
    } else {
      res.status(400).send({ error: `Show ${show._id} does not exist` });
    }
  } catch (error) {
    console.log(error);
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      console.log(error.message);
      res.status(400).send({ error: error.message });
    }
  }
};

exports.editOrder = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { shows } = req.body; // {_id: "", order: 0}

    const tokenData = jwt.verify(token, jwtSecret);

    const updatePromises = shows.map((show) => {
      return User.updateOne(
        { _id: tokenData.id },
        {
          $set: {
            "show_list.$[s].order": show.order,
          },
        },
        {
          arrayFilters: [{ "s._id": show._id }],
        }
      );
    });

    await Promise.all(updatePromises);

    const user = await User.findOne({ _id: tokenData.id });

    const updatedShows = user.show_list;

    res.status(200).send({ shows: updatedShows });
  } catch (error) {
    console.log(error);
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      console.log(error.message);
      res.status(400).send({ error: error.message });
    }
  }
};
