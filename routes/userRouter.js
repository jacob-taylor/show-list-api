const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.route("/users").get(userController.index).post(userController.new);

router
  .route("/shows")
  .get(userController.showIndex)
  .post(userController.addShow)
  .patch(userController.editShow)
  .delete(userController.removeShow);

router.route("/nuke-shows").get(userController.showNuke);

router.route("/login").post(userController.login);

module.exports = router;
