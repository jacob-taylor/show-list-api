const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.route("/users").get(userController.index).post(userController.new);

router.route("/login").post(userController.login);

module.exports = router;
