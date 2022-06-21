const express = require("express");
const router = express.Router();

const userController = require("./controllers/userController");
const showController = require("./controllers/showController");

router
  .route("/users")
  .get(userController.index)
  .post(userController.new)
  .patch(userController.edit);

router.route("/users/all").get(userController.all);

router
  .route("/shows")
  .get(showController.index)
  .post(showController.add)
  .patch(showController.edit)
  .delete(showController.remove);

router.route("/shows/order").patch(showController.editOrder);

router.route("/login").post(userController.login);
router.route("/reset").post(userController.reset);
router.route("/code").post(userController.code);
router.route("/password").post(userController.password);

module.exports = router;
