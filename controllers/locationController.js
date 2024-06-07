const asyncHandler = require("express-async-handler");
const {
  validateAddLocation,
  Location,
  validateUpdateLocation,
} = require("../models/location");
const { User } = require("../models/user");
const { Car } = require("../models/car");
const { City } = require("../models/city");
const { ADMIN_PER_PAGE } = require("../lib/constant");

module.exports.getAllLocations = asyncHandler(async (req, res) => {
  const { search, page } = req.query;

  let query = {};

  if (search) {
    const city = await City.findOne({ name: new RegExp(search, "i") });
    const cityCondition = city ? { cityId: city._id } : null;

    query = {
      $or: [
        { name: new RegExp(search, "i") },
        { adresse: new RegExp(search, "i") },
        cityCondition ? cityCondition : { _id: null },
      ],
    };
  }
  let locations;
  if (page) {
    locations = await Location.find(query)
      .skip((page - 1) * ADMIN_PER_PAGE)
      .limit(ADMIN_PER_PAGE)
      .populate("cityId")
      .populate("managerId")
      .populate("cars");
  }
  locations = await Location.find(query)
    .populate("cityId")
    .populate("managerId")
    .populate("cars");
  const countLocation = await Location.countDocuments(query);
  res.status(200).json({ count: countLocation, locations: locations });
});
module.exports.getSingleLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id)
    .populate("managerId", ["-password"])
    .populate("cityId");
  res.status(200).json(location);
});

module.exports.addLocation = asyncHandler(async (req, res) => {
  const { error } = validateAddLocation(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const manager = await User.findById(req.body.managerId);
  if (!manager) {
    return res.status(400).json({ message: "User not found" });
  }
  const existingLocation = await Location.findOne({ managerId: manager._id });
  if (existingLocation) {
    return res
      .status(400)
      .json({ message: "Manager is already responsible for another location" });
  }
  manager.role = 2;
  await manager.save();

  const location = await Location.create({
    name: req.body.name,
    phone: req.body.phone,
    adresse: req.body.adresse,
    cityId: req.body.cityId,
    managerId: manager._id,
  });

  res.status(200).json(location);
});
const updateLocation = asyncHandler(async (req, res) => {
  const { error } = validateUpdateLocation(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const location = await Location.findById(req.params.id);
  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }

  const oldManagerId = location.managerId.toString();
  const newManagerId = req.body.managerId;

  // Check if the manager is being changed
  if (newManagerId && oldManagerId !== newManagerId) {
    const manager = await User.findById(newManagerId);
    if (!manager) {
      return res.status(400).json({ message: "New manager not found" });
    }

    const existingLocation = await Location.findOne({
      managerId: newManagerId,
    });
    if (existingLocation) {
      return res.status(400).json({
        message: "Manager is already responsible for another location",
      });
    }

    const oldManager = await User.findById(oldManagerId);
    if (oldManager) {
      oldManager.role = 3;
      await oldManager.save();
    }

    manager.role = 2;
    await manager.save();

    location.managerId = newManagerId;
  }

  const updatedLocation = await Location.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      phone: req.body.phone,
      adresse: req.body.adresse,
      cityId: req.body.cityId,
      managerId: location.managerId,
    },
    { new: true }
  );

  res.status(200).json(updatedLocation);
});

module.exports.updateLocation = updateLocation;

module.exports.deleteLocation = asyncHandler(async (req, res) => {
  const location = await Location.findById(req.params.id);
  if (!location) {
    return res.status(404).json({ message: "location not found" });
  }

  if (req.user.role === 1) {
    const manager = await User.findById(location.managerId);
    if (!manager) {
      return res.status(400).json({ message: "User not found" });
    }
    manager.role = 3;
    await manager.save();
    await Car.deleteMany({ locationId: location._id });
    await Location.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Location has been deleted !" });
  } else {
    res.status(403).json({ message: "Acces denied" });
  }
});
