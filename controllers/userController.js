const User = require("../models/user");

exports.getProfile = async (req, res, next) => {
  try {
    // get User Id from req.user object
    const user = await User.findById(req.user);
    if (!user) {
      return res.send("This user doesn't exist anymore");
    }
    res.status(200).json({
      status: "sucess",
      data: { user },
    });
    // return user data
  } catch (error) {
    console.log(error);
    res.send("An error has occured");
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    // get User Id from req.user object
    // return user data
  } catch (error) {
    console.log(error);
    res.send("An error has occured");
  }
};
