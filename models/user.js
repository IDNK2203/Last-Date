const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      required: [true, "please provide a name"],
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: "please provide a valid email",
      },
      lowercase: true,
    },
    password: {
      required: true,
      type: String,
      minLength: 8,
      select: [true, "please confirm a password"],
    },
    passwordConfirm: {
      type: String,
      required: true,
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: "confirm your password",
      },
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    photo: {
      type: String,
      default: "default.jpg",
    },
    DateOfBirth: Date,
    languages: [String],
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    maxMatchLocalization: [String],
    matchGender: {
      type: [String],
      enum: ["Male", "Female"],
    },
    hobbies: [String],
    description: {
      type: String,
      trim: true,
    },
    matchMaxAge: Number,
    matchMinAge: {
      type: Number,
      min: 18,
    },
    personality: {
      favCity: String,
      favCar: String,
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

userSchema.pre("save", async function (next) {
  // check if password was modified upon creating or updating user
  if (!this.isModified("password")) return next();
  // if were saving or updating doc and password was not modified don't run the code below.

  // Note
  // upon doc creation password will be modified
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.method({
  passwordCheck: async function (incomingPassword, passwordHash) {
    return await bcrypt.compare(incomingPassword, passwordHash);
  },
});

const User = mongoose.model("user", userSchema);

module.exports = User;
