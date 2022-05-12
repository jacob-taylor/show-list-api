require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const seedrandom = require("seedrandom");
const formData = require("form-data");
const Mailgun = require("mailgun.js");

const User = require("../models/userModel");

const jwtSecret = process.env.JWT_SECRET;

exports.index = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

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

exports.all = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    if (token === jwtSecret) {
      const users = await User.find();

      res.json({ users });
    } else {
      res.sendStatus(401);
    }
  } catch (error) {
    res.status(500).send({ error });
  }
};

exports.new = async (req, res) => {
  try {
    const user = new User();
    const { email, password } = req.body;

    user.email = email;
    user.password_hash = await bcrypt.hash(password, 10);

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
    if (error?.code === 11000) {
      return res.status(400).send({ error: "User already exists" });
    }
    throw error;
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

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

exports.reset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const mailgun = new Mailgun(formData);
      const mg = mailgun.client({
        username: "api",
        key: process.env.MAILGUN_API_KEY,
      });

      const rng = seedrandom(crypto.randomBytes(64).toString("base64"), {
        entropy: true,
      });
      const code = rng().toString().substring(3, 9);

      await User.updateOne(
        { email },
        {
          $set: {
            reset_password_code: code,
          },
        }
      );

      await mg.messages.create("thelistnow.com", {
        from: "No Reply <no-reply@thelistnow.com>",
        to: [email],
        subject: "Reset Password Code",
        html: `<div>Please use this code to reset your password: <b>${code}</b></div>`,
      });

      res.status(200).send({ msg: "User found, code sent" });
    } else {
      res.status(400).send({ msg: "No user found with that email address" });
    }
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

exports.code = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findOne({ reset_password_code: code });

    if (user) {
      res.status(200).send({ msg: "Code verified" });
    } else {
      res.status(400).send({ msg: "Code not valid" });
    }
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

exports.password = async (req, res) => {
  try {
    const { email, password, code } = req.body;
    const user = await User.findOne({ email });

    if (user && user.reset_password_code === Number(code)) {
      const passwordHash = await bcrypt.hash(password, 10);

      await User.updateOne(
        { email },
        {
          $set: {
            password_hash: passwordHash,
            reset_password_code: null,
          },
        }
      );

      res.status(200).send({ msg: "Password reset" });
    } else {
      res.status(400).send({ msg: "User not valid" });
    }
  } catch (error) {
    res.status(500).send({ msg: error.message });
  }
};

exports.edit = async (req, res) => {
  try {
    const [bearer, token] = req.headers.authorization.split(" ");

    const { push_notifications, push_token, streaming_services } = req.body;

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
    if (error.name === "JsonWebTokenError") {
      res.sendStatus(401); // 401 is unathorized and should log the user out on the client
    } else {
      res.status(400).send({ error: error.message });
    }
  }
};
