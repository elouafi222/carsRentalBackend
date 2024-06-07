const asyncHandler = require("express-async-handler");
const { User, validateUpdateProfile } = require("../models/user");
const { Booking } = require("../models/booking");
const { ADMIN_PER_PAGE } = require("../lib/constant");

module.exports.getAllUsers = asyncHandler(async (req, res) => {
  const { search, page } = req.query;

  let query = {
    _id: { $ne: req.user.id },
  };

  if (search) {
    query.$or = [
      { firstname: new RegExp(search, "i") },
      { lastname: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }

  try {
    let users;
    let count;

    if (page) {
      users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * ADMIN_PER_PAGE)
        .limit(ADMIN_PER_PAGE);

      count = await User.countDocuments(query);
    } else {
      users = await User.find(query).sort({ createdAt: -1 });
      count = users.length;
    }

    res.status(200).json({ count, users });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});
module.exports.getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate({
    path: "books",
    options: { sort: { createdAt: -1 } },
    populate: {
      path: "carId",
      populate: {
        path: "locationId",
        populate: {
          path: "cityId",
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "Profile not found" });
  }
  res.status(200).json(user);
});

module.exports.updateProfile = asyncHandler(async (req, res) => {
  const { error } = validateUpdateProfile(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  if (req.user.id !== req.params.id) {
    res.status(403).json({ message: "Acces denied, Only for the owner" });
  }
  const updateProfile = await User.findByIdAndUpdate(
    req.params.id,
    {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      phone: req.body.phone,
    },
    { new: true }
  );
  res.status(200).json(updateProfile);
});
module.exports.deteleProfile = asyncHandler(async (req, res) => {
  if (req.user.id !== req.params.id && req.user.role !== 1) {
    res.status(403).json({ message: "Acces denied, Only for the owner" });
  }
  await Booking.deleteMany({ userId: req.user.id });
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Profile deleted" });
});
