const asyncHandler = require("express-async-handler");
const { City, validateAddCity } = require("../models/city");
const { ADMIN_PER_PAGE } = require("../lib/constant");
const { Car } = require("../models/car");
const { cloudinaryRemoveImage } = require("../lib/cloudinay");
const { Location } = require("../models/location");

module.exports.addCity = asyncHandler(async (req, res) => {
  const { error } = validateAddCity(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const cityName = req.body.name.toUpperCase();
  let city = await City.findOne({ name: cityName });
  if (city) return res.status(400).json({ message: "City already exists" });
  city = await City.create({
    name: cityName,
  });
  res.status(201).json(city);
});
module.exports.getAllCities = asyncHandler(async (req, res) => {
  const { search, page } = req.query;
  let query = {};

  if (search) {
    query.$or = [{ name: new RegExp(search, "i") }];
  }

  let aggregationPipeline = [
    { $match: query },
    {
      $lookup: {
        from: "locations",
        localField: "_id",
        foreignField: "cityId",
        as: "locations",
      },
    },
    {
      $addFields: {
        locationCount: { $size: "$locations" },
      },
    },
    {
      $lookup: {
        from: "cars",
        localField: "locations._id",
        foreignField: "locationId",
        as: "cars",
      },
    },
    {
      $addFields: {
        carCount: { $size: "$cars" },
      },
    },
    { $sort: { carCount: -1 } },
  ];

  if (page) {
    aggregationPipeline.push(
      { $skip: (page - 1) * ADMIN_PER_PAGE },
      { $limit: ADMIN_PER_PAGE }
    );
  }

  const cities = await City.aggregate(aggregationPipeline);

  const count = await City.countDocuments(query);

  res.status(200).json({ count, cities });
});

module.exports.updateCity = asyncHandler(async (req, res) => {
  const { error } = validateAddCity(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  let city = await City.findById(req.params.id);
  if (!city) {
    return res.status(404).json({ messages: "City not found" });
  }
  city.name = req.body.name.toUpperCase();
  await city.save();

  res.status(200).json(city);
});

module.exports.deleteCity = asyncHandler(async (req, res) => {
  const cityId = req.params.id;

  const city = await City.findById(cityId);
  if (!city) {
    return res.status(404).json({ message: "City not found" });
  }
  const locations = await Location.find({ cityId: cityId });

  for (const location of locations) {
    const cars = await Car.find({ locationId: location._id });
    for (const car of cars) {
      if (car.image && car.image.publicId) {
        await cloudinaryRemoveImage(car.image.publicId);
      }
      await Car.findByIdAndDelete(car._id);
    }
    await Location.findByIdAndDelete(location._id);
  }
  await City.findByIdAndDelete(cityId);

  res
    .status(200)
    .json({ message: "City and all its associated data deleted successfully" });
});
