const mongoose = require("mongoose");
const joi = require("joi");
const passworComplexity = require("joi-password-complexity");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const UserSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: Number,
      default: 3,
    },
    isAccountVerified: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON : { virtuals : true},  
    toObject : { virtuals : true}
  }
);
UserSchema.methods.generateAuthToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.SECRET);
};
UserSchema.virtual("books", {
  ref : "Booking",
  foreignField : "userId",
  localField : "_id"
})
const User = mongoose.model("User", UserSchema);

function validateSignupUser(obj) {
  const schema = joi.object({
    firstname: joi.string().trim().required(),
    lastname: joi.string().trim().required(),
    email: joi
      .string()
      .trim()
      .email()
      .required()
      .error(new Error("Email not valide")),
    phone: joi.string().trim().required(),
    password: joi.required(),
  });
  return schema.validate(obj);
}

function validateUpdateProfile(obj) {
  const schema = joi.object({
    firstname: joi.string().trim(),
    lastname: joi.string().trim(),
    phone: joi.string().trim(),
  });
  return schema.validate(obj);
}
function validateLoginUser(obj) {
  const schema = joi.object({
    email: joi.string().trim().email().required(),
    password: joi.string().trim().required(),
  });
  return schema.validate(obj);
}

function validateEamil(obj) {
  const schema = joi.object({
    email: joi.string().trim().email().required(),
  });
  return schema.validate(obj);
}
function validateNewPassword(obj) {
  const schema = joi.object({
    password: joi.required(),
  });
  return schema.validate(obj);
}
module.exports = {
  User,
  validateSignupUser,
  validateLoginUser,
  validateEamil,
  validateNewPassword,
  validateUpdateProfile
};
