const express = require("express");
const Router = express.Router();
const authCtrls = require("../controllers/authController");
const userCtrls = require("../controllers/userController");

Router.post("/register", authCtrls.register);
Router.post("/login", authCtrls.login);
Router.post("/logout", authCtrls.logout);

Router.use(authCtrls.protect);

Router.route("/profile")
  .get(userCtrls.getProfile)
  .patch(userCtrls.updateProfile);

module.exports = Router;
