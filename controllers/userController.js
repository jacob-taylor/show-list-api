require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/userModel");

const jwtSecret = process.env.JWT_SECRET;

exports.index = async (req, res) => {
  const { token } = req.body;
  const data = jwt.verify(token, jwtSecret);

  const user = await User.findOne({ email: data.email });

  delete user.password_hash;
  delete user.__v;

  res.json({ user });
};

exports.new = async (req, res) => {
  const user = new User();
  const { email, password } = req.body;

  user.email = email;
  user.password_hash = await bcrypt.hash(password, 14);

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
      return res.status(404).send({ message: "The username does not exist" });
    }
    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).send({ message: "The password is invalid" });
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
