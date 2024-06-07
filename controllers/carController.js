const asyncHandler = require("express-async-handler");
const { validateAddCar, Car, validateUpdateCar } = require("../models/car");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../lib/cloudinay");
const fs = require("fs");
const path = require("path");
const { USER_PER_PAGE, ADMIN_PER_PAGE } = require("../lib/constant");
const { Location } = require("../models/location");
const mongoose = require("mongoose");
module.exports.getAllCarsForAdminstrations = asyncHandler(async (req, res) => {
  const { search, disponible, page } = req.query;
  try {
    let pipeline = [
      {
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: "$location" },
      {
        $lookup: {
          from: "cities",
          localField: "location.cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      { $unwind: "$city" },
      {
        $project: {
          brand: 1,
          locationId: 1,
          image: 1,
          model: 1,
          fuel: 1,
          seats: 1,
          rating: 1,
          price: 1,
          disponible: 1,
          transmission: 1,
          _id: 1,
          "location.name": 1,
          "location.managerId": 1,
          "city.name": 1,
        },
      },
    ];
    if (disponible) {
      const dispo =
        disponible === "true" ? true : disponible === "false" ? false : "";
      pipeline.push({
        $match: {
          disponible: dispo,
        },
      });
    }
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { brand: { $regex: search, $options: "i" } },
            { price: { $lte: parseInt(search) } },
            { "city.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }
    if (req.user.role === 2) {
      pipeline.push({
        $match: {
          "location.managerId": new mongoose.Types.ObjectId(req.user.id),
        },
      });
    }
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Car.aggregate(countPipeline);
    const countCar = countResult.length > 0 ? countResult[0].total : 0;

    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * ADMIN_PER_PAGE },
      { $limit: ADMIN_PER_PAGE }
    );

    const cars = await Car.aggregate(pipeline);

    res.status(200).json({ count: countCar, cars });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports.getAllCars = asyncHandler(async (req, res) => {
  const { page, brand, loc, city, search } = req.query;
  let matchQuery = {};

  if (brand) {
    matchQuery.brand = brand;
  }

  if (loc) {
    matchQuery.locationId = new mongoose.Types.ObjectId(loc);
  }

  try {
    let pipeline = [
      {
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: "$location" },
      {
        $lookup: {
          from: "cities",
          localField: "location.cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      { $unwind: "$city" },
      {
        $project: {
          brand: 1,
          locationId: 1,
          image: 1,
          model: 1,
          fuel: 1,
          seats: 1,
          rating: 1,
          price: 1,
          disponible: 1,
          transmission: 1,
          _id: 1,
          "location.name": 1,
          "city.name": 1,
        },
      },
    ];

    if (city) {
      pipeline.push({
        $match: { "city.name": new RegExp(city, "i") },
      });
    }

    if (Object.keys(matchQuery).length) {
      pipeline.push({ $match: matchQuery });
    }

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { brand: { $regex: search, $options: "i" } },
            { price: { $lte: parseInt(search) } },
            { "city.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await Car.aggregate(countPipeline);
    const countCar = countResult.length > 0 ? countResult[0].total : 0;
    pipeline.push(
      { $match: { disponible: true } },
      { $sort: { createdAt: -1 } },
      { $skip: (page - 1) * USER_PER_PAGE },
      { $limit: USER_PER_PAGE }
    );

    const cars = await Car.aggregate(pipeline);

    res.status(200).json({ count: countCar, cars });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports.getSingleCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id).populate({
    path: "locationId",
    populate: {
      path: "cityId",
      model: "City",
    },
  });

  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }
  res.status(200).json(car);
});

module.exports.addCar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image provided" });
  }

  const { error } = validateAddCar(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  let location;
  try {
    if (req.user.role !== 1) {
      location = await Location.findOne({ managerId: req.user.id });
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }
      if (
        req.user.id.toString() !== location.managerId.toString() &&
        location._id.toString() === req.body.locationId
      ) {
        return res
          .status(403)
          .json({ message: "Access denied, Only for the manager" });
      }
    }

    const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
    const result = await cloudinaryUploadImage(imagePath);

    const car = await Car.create({
      brand: req.body.brand,
      model: req.body.model,
      transmission: req.body.transmission,
      fuel: req.body.fuel,
      price: parseInt(req.body.price),
      seats: parseInt(req.body.seats),
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
      locationId:
        req.user.role === 1 ? req.body.locationId : location._id.toString(),
    });

    res.status(200).json(car);
    fs.unlinkSync(imagePath);
  } catch (err) {
    console.error(err);
    fs.unlinkSync(req.file.path); // Delete the uploaded image if there is an error
    res.status(500).json({ message: "Server error" });
  }
});
module.exports.updateCar = asyncHandler(async (req, res) => {
  const { error } = validateUpdateCar(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  if (req.user.role !== 1) {
    const location = await Location.findOne({ managerId: req.user.id });
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    if (req.user.id.toString() !== location.managerId.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied, Only for the manager" });
    }
  }
  const updateCar = await Car.findByIdAndUpdate(
    req.params.id,
    {
      brand: req.body.brand,
      model: req.body.model,
      transmission: req.body.transmission,
      fuel: req.body.fuel,
      price: req.body.price,
      seats: req.body.seats,
    },
    { new: true }
  );
  res.status(200).json(updateCar);
});

module.exports.changeDisponibility = asyncHandler(async (req, res) => {
  if (req.user.role !== 1) {
    const location = await Location.findOne({ managerId: req.user.id });
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    if (req.user.id.toString() !== location.managerId.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied, Only for the manager" });
    }
  }

  const car = await Car.findById(req.params.id);
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }
  car.disponible = !car.disponible;
  const updatedCar = await car.save();

  res.status(200).json(updatedCar);
});

module.exports.deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }
  if (req.user.role !== 1) {
    const location = await Location.findById(car.locationId);
    if (!location) {
      return res.status(404).json({ message: "Location not found" });
    }
    if (req.user.id.toString() !== location.managerId.toString()) {
      return res
        .status(403)
        .json({ message: "Access denied, Only for the manager" });
    }
  }
  await cloudinaryRemoveImage(car.image.publicId);
  await Car.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Car has been deleted !" });
});

module.exports.updateCarImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No image provided" });

  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: "Car not found" });

  const location = await Location.findById(car.locationId);
  if (!location) return res.status(404).json({ message: "Location not found" });

  if (req.user.id !== location.managerId.toString() && req.user.role !== 1)
    return res.status(403).json({ message: "Accès refusé, non autorisé" });
  console.log(car.image.publicId);
  await cloudinaryRemoveImage(car.image.publicId);
  const imagePath = path.join(__dirname, `../images/${req.file.filename}`);
  const result = await cloudinaryUploadImage(imagePath);
  console.log(result);
  const updateimage = await Car.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      },
    },
    { new: true }
  );

  res.status(200).json(updateimage);
  fs.unlinkSync(imagePath);
});

module.exports.rateCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) return res.status(404).json({ message: "Car not found" });
  const existingRating = car.rating.find(
    (rate) => rate.userId.toString() === req.user.id.toString()
  );
  if (existingRating) {
    existingRating.rateStars = req.body.rateStars;
  } else {
    car.rating.push({
      userId: req.user.id.toString().trim(),
      rateStars: req.body.rateStars,
    });
  }
  await car.save();
  res.status(200).json(car);
});
module.exports.getAllCarBrands = asyncHandler(async (req, res) => {
  const brands = await Car.find({ disponible: true }).distinct("brand");
  res.status(200).json(brands);
});

module.exports.getAllCarCities = asyncHandler(async (req, res) => {
  try {
    const topCities = await Car.aggregate([
      {
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      { $unwind: "$location" },
      {
        $lookup: {
          from: "cities",
          localField: "location.cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      { $unwind: "$city" },
      {
        $match: {
          disponible: true,
        },
      },
      {
        $group: {
          _id: "$city._id",
          cityName: { $first: "$city.name" },
          carCount: { $sum: 1 },
        },
      },
      { $project: { _id: 0, cityId: "$_id", cityName: 1, carCount: 1 } },
      { $sort: { carCount: -1 } },
      { $limit: 8 },
    ]);
    res.status(200).json(topCities);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch car cities" });
  }
});
module.exports.getTopRatedCars = asyncHandler(async (req, res) => {
  try {
    let pipeline = [];

    if (req.user.role === 2) {
      pipeline.push({
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location",
        },
      });

      pipeline.push({
        $match: {
          "location.managerId": new mongoose.Types.ObjectId(req.user.id),
        },
      });
    }

    pipeline.push(
      {
        $unwind: "$rating",
      },
      {
        $group: {
          _id: {
            carId: "$_id",
            model: "$model",
            brand: "$brand",
          },
          avgRating: { $avg: "$rating.rateStars" },
          numRaters: { $sum: 1 },
        },
      },
      {
        $sort: { avgRating: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          model: { $concat: ["$_id.brand", " ", "$_id.model"] },
          avgRating: 1,
          numRaters: 1,
        },
      }
    );

    const result = await Car.aggregate(pipeline);

    res.status(200).json(result);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch car cities" + error.message });
  }
});
