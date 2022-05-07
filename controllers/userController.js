require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const jwtSecret = process.env.JWT_SECRET;

exports.index = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  try {
    const data = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ email: data.email });

    delete user.password_hash;
    delete user.__v;

    res.json({ user });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      res.status(400).send({ error });
    }
  }
};

exports.new = async (req, res) => {
  const user = new User();
  const { email, password } = req.body;

  user.email = email;
  user.password_hash = await bcrypt.hash(password, 10);

  try {
    const newUser = await user.save();
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: "mobile-user",
      },
      jwtSecret
    );

    delete newUser.password_hash;
    delete newUser.__v;

    return res.json({ token, user: newUser });
  } catch (error) {
    console.log("Error creating user", error);
    if (error?.code === 11000) {
      return res.status(400).send({ error: "User already exists" });
    }
    throw error;
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // https://mongoosejs.com/docs/tutorials/lean.html
    const user = await User.findOne({ email }).lean();
    if (!user) {
      return res.status(400).send({ error: "The email does not exist" });
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(400).send({ error: "The password is invalid" });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        type: "mobile-user",
      },
      jwtSecret
    );

    delete user.password_hash;
    delete user.__v;

    return res.json({ token, user });
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

exports.edit = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  const { push_notifications, push_token, streaming_services } = req.body;

  try {
    const tokenData = jwt.verify(token, jwtSecret);

    await User.updateOne(
      { _id: tokenData.id },
      {
        $set: {
          push_notifications,
          push_token,
          streaming_services,
        },
      }
    );
    const editedUser = await User.findOne({ _id: tokenData.id });

    res.status(200).send({ editedUser });
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

exports.showIndex = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");
  try {
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

exports.addShow = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  const { show } = req.body;

  if (!show) {
    return res.status(400).send({ error: "No show was added" });
  }
  try {
    const tokenData = jwt.verify(token, jwtSecret);

    const user = await User.findOne({ email: tokenData.email });

    await user.show_list.push(show);
    await user.save();

    const newShow = user.show_list.find(
      (s) => s.id.toString() === show.id.toString()
    );

    res.status(200).send({ show: newShow });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      res.status(400).send({ error });
    }
  }
};

exports.removeShow = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  const { show } = req.body;

  try {
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

exports.editShow = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  const { show } = req.body;

  try {
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
            "show_list.$[s].reminder_date": show.reminder_date,
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

// DEV ONLY
exports.showNuke = async (req, res) => {
  const [bearer, token] = req.headers.authorization.split(" ");

  try {
    const tokenData = jwt.verify(token, jwtSecret);

    await User.findByIdAndUpdate(
      { _id: tokenData.id },
      {
        $set: {
          show_list: [],
        },
      }
    );
    res.sendStatus(200);
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      console.log(error.message);
      res.status(400).send({ error: error.message });
    }
  }
};
