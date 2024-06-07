const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");

// const VerificationToken = require("../models/verificationToken");
const crypto = require("crypto");
const {
  User,
  validateSignupUser,
  validateLoginUser,
} = require("../models/user");
// const sendEmail = require("../utils/sendEmail");

module.exports.signup = asyncHandler(async (req, res) => {
  const { error } = validateSignupUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).json({ message: "Email used" });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);
  user = new User({
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    email: req.body.email,
    phone: req.body.phone,
    password: hashedPassword,
  });
  await user.save();

  //   const verificationToken = new VerificationToken({
  //     userId: user._id,
  //     token: crypto.randomBytes(32).toString("hex"),
  //   });
  //   await verificationToken.save();

  //   const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;
  //   const htmlTemplate = `
  //      <div>
  //      <p>Click in the link below to verify your email ! </p>
  //      <a href="${link}">Verify Email</a>
  //      </div>`;
  //   await sendEmail(user.email, "Verify Your Email", htmlTemplate);
  // message: "We sent to you an email, Please verify your email inbox !",
  res.status(201).json({
    message: "Registre successfully",
  });
});

module.exports.login = asyncHandler(async (req, res) => {
  const { error } = validateLoginUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).json({ message: "Email not exists" });
  const isPasswordMatch = await bcrypt.compare(
    req.body.password,
    user.password
  );
  if (!isPasswordMatch) {
    return res.status(400).json({ message: "Password incorrect" });
  }
  //   if (!user.isAccountVerified) {
  //     let verificationToken = await VerificationToken.findOne({
  //       userId: user._id,
  //     });
  //     if (!verificationToken) {
  //       const verificationToken = new VerificationToken({
  //         userId: user._id,
  //         token: crypto.randomBytes(32).toString("hex"),
  //       });
  //       await verificationToken.save();
  //     }
  //     const link = `${process.env.CLIENT_DOMAIN}/users/${user._id}/verify/${verificationToken.token}`;
  //     const htmlTemplate = `
  //      <div>
  //      <p>Click in the link below to verify your email ! <>
  //      <a href="${link}">Verify Email</a>
  //      </div>`;
  //     await sendEmail(user.email, "Verify Your Email", htmlTemplate);
  //     res.status(400).json({
  //       message: "We sent to you an email, Please verify your email inbox !",
  //     });
  //   }
  const token = user.generateAuthToken();
  await user.save();
  res.status(201).json({
    firstname: user.firstname,
    lastname: user.lastname,
    _id: user._id,
    role: user.role,
    token,
  });
});
// module.exports.verifyUserAccount = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.params.userId);
//   if (!user) {
//     return res.status(400).json({ message: "Invalid link!" });
//   }

//   const verificationToken = await VerificationToken.findOne({
//     userId: user._id,
//     token: req.params.token,
//   });

//   if (!verificationToken) {
//     return res.status(400).json({ message: "Invalid link!" });
//   }

//   user.isAccountVerified = true;
//   await user.save();

//   await VerificationToken.deleteOne({
//     userId: user._id,
//     token: req.params.token,
//   });

//   res.status(200).json({ message: "Your Account Verified." });
// });
