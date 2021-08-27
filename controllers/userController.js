const User = require("../models/user");
const AppError = require("./../utils/appError");


exports.getProfile = async (req, res, next) => {
  try {
    // get User Id from req.user object
    const user = await User.findById(req.user);
    if (!user) {
      return next(new AppError("This user doesn't exist anymore", 404));
    }
    res.status(200).json({
      status: "sucess",
      data: { user },
    });
    // return user data
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // get User Id from req.user object
    // return user data
  } catch (error) {
    console.log(error);
    next(error);
  }
};
