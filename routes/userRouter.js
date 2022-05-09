const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router
  .route("/users")
  .get(userController.index)
  .post(userController.new)
  .patch(userController.edit);

router
  .route("/shows")
  .get(userController.showIndex)
  .post(userController.addShow)
  .patch(userController.editShow)
  .delete(userController.removeShow);

router.route("/login").post(userController.login);

module.exports = router;
