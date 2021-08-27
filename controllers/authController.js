const User = require("../models/user");
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/appError");
const crypto = require("crypto");
const { promisify } = require("util");
const Email = require("../utils/email");

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const sendTokenAndResData = async (res, statusCode, user) => {
  const token = await createToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRY_DATE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    user,
  });
};

exports.register = async (req, res, next) => {
  try {
    // User Registration for single Factor authenication

    //@2 validate user request data
    //@3 create user doc
    const user = await User.create({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });
    // hash user password

    //@4 recreate JWT token & stuff inside cookie and send to client
    await sendTokenAndResData(res, 201, user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    // 1@ Validate sent user data
    if (!req.body.password || !req.body.email) {
      return res.send("Provide your email and password");
    }
    // 2@ check if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("This user doesn't exist anymore", 404));
    }
    // 3@ check if user password is correct
    if (
      (await user.passwordCheck(req.body.password, user.password)) === false
    ) {
      return next(new AppError("Incorrect password", 400));
    }
    // @4 recreate JWT token & stuff inside cookie and send to client
    await sendTokenAndResData(res, 200, user);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.logout = (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", "loggedout", cookieOptions);

  res.status(200).json({
    meassge: "user logged out",
    status: "success",
  });
};

exports.protect = async (req, res, next) => {
  try {
    // @Purpose : to protect unauthenicated users from gaining some specfic routes
    let token;
    // @1 extract token from cookie or bearer token header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return next(
        new AppError(
          "you are not logged in please log in to view this resource",
          401
        )
      );
    }
    // CHECKS
    // @2 check if token has expired
    // @3 check if token  is valid
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // @4 check if user exists
    const user = await User.findById(decodedToken.id);
    if (!user) {
      return next(new AppError("This user doesn't exist anymore", 404));
    }

    // @6 parser user data in req.user
    req.user = user.id;
    next();
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  // steps

  // 1) get user email from post request
  const user = await User.findOne({ email: req.body.email });

  if (!user) return next(new AppError("This user does not exist", 404));

  // 2) create random reset password token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send token back to user
  const resetUrl = `${req.protocol}//${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forgot your password ? submit a PaTCH request with your new password and confirmPassword
  // to this url${resetUrl}.\nIf you didn,t forget your password pleas ignore this email.`;

  // steps to implement new Email reset password method
  // create reset password email template
  // create reset  password  email method
  // call reset password email method in reset password middleware.

  try {
    await new Email(user, resetUrl).ResetPassword();

    res.status(200).json({
      status: "sucess",
      message: "your password reset token has been sent to your email",
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.tokenExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "An error occured during the email send operation , please try again later",
        500
      )
    );
  }
};
exports.resetPassword = async (req, res, next) => {
  // steps
  try {
    const enIncomingToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // 3) check if token timestamp and compare with tokenExpiresAt

    const user = await User.findOne({
      passwordResetToken: enIncomingToken,
      tokenExpiresAt: { $gte: Date.now() },
    });

    if (!user)
      return next(
        new AppError(
          "This is an invalid reset token or token has expired ",
          404
        )
      );

    // 4) reset user password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    // 5) delete tokenExpiresAt value from dataBase
    user.passwordResetToken = undefined;
    user.tokenExpiresAt = undefined;
    await user.save();

    // update passwordUpdateAt to current time

    // login user
    sendTokenAndResData(res, 201, user);
  } catch (error) {
    next(error);
  }
};
