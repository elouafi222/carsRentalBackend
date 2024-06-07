const asyncHandler = require("express-async-handler");
const {
  Booking,
  validateBooking,
  validateUpdateBooking,
} = require("../models/booking");
const { Location } = require("../models/location");
const { Car } = require("../models/car");
const { User } = require("../models/user");
const moment = require("moment");
const { ADMIN_PER_PAGE } = require("../lib/constant");

module.exports.getAllBookingsRequests = asyncHandler(async (req, res) => {
  const { page } = req.query;
  let bookings;
  let countBooking;

  if (req.user.role === 2) {
    const location = await Location.findOne({ managerId: req.user.id });

    if (location) {
      const carsInLocation = await Car.find({
        locationId: location._id,
      });

      const carIds = carsInLocation.map((car) => car._id);

      bookings = await Booking.find({ carId: { $in: carIds }, status: 1 })
        .skip((page - 1) * ADMIN_PER_PAGE)
        .limit(ADMIN_PER_PAGE)
        .sort({ createdAt: -1 })
        .populate({
          path: "carId",
          populate: {
            path: "locationId",
            populate: {
              path: "cityId",
            },
          },
        })
        .populate("userId");
      countBooking = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 1,
      });
    } else {
      bookings = [];
      countBooking = 0;
    }
  } else {
    bookings = await Booking.find({ status: 1 })
      .skip((page - 1) * ADMIN_PER_PAGE)
      .limit(ADMIN_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate({
        path: "carId",
        populate: {
          path: "locationId",
          populate: {
            path: "cityId",
          },
        },
      })
      .populate("userId");
    countBooking = await Booking.countDocuments({ status: 1 });
  }

  res.status(200).json({ count: countBooking, bookings: bookings });
});

module.exports.getAllBookings = asyncHandler(async (req, res) => {
  const { status, page, bookid } = req.query;
  const queryStatus = status ? parseInt(status) : { $ne: 1 };

  let bookings;
  let countBooking;
  let queryCriteria = { status: queryStatus };

  if (bookid) {
    queryCriteria._id = bookid.toString();
  }

  if (req.user.role === 2) {
    const location = await Location.findOne({ managerId: req.user.id });

    if (location) {
      const carsInLocation = await Car.find({ locationId: location._id });
      const carIds = carsInLocation.map((car) => car._id);

      queryCriteria.carId = { $in: carIds };

      bookings = await Booking.find(queryCriteria)
        .skip((page - 1) * ADMIN_PER_PAGE)
        .limit(ADMIN_PER_PAGE)
        .sort({ createdAt: -1 })
        .populate({
          path: "carId",
          populate: {
            path: "locationId",
            populate: {
              path: "cityId",
            },
          },
        })
        .populate("userId");

      countBooking = await Booking.countDocuments(queryCriteria);
    } else {
      bookings = [];
      countBooking = 0;
    }
  } else {
    bookings = await Booking.find(queryCriteria)
      .skip((page - 1) * ADMIN_PER_PAGE)
      .limit(ADMIN_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate({
        path: "carId",
        populate: {
          path: "locationId",
          populate: {
            path: "cityId",
          },
        },
      })
      .populate("userId");

    countBooking = await Booking.countDocuments(queryCriteria);
  }

  res.status(200).json({ count: countBooking, bookings: bookings });
});

module.exports.booking = asyncHandler(async (req, res) => {
  const { error } = validateBooking(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  if (new Date(req.body.dateFin) <= new Date(req.body.dateDebut)) {
    return NextResponse.json(
      { message: "Date fin must be greater than dateDebut" },
      { status: 400 }
    );
  }
  const booking = await Booking.create({
    dateStart: req.body.dateStart,
    dateFin: req.body.dateFin,
    heure: req.body.heure,
    delivery: req.body.delivery,
    driver: req.body.driver,
    isPayOnline: req.body.isPayOnline,
    carId: req.body.carId,
    userId: req.user.id,
    status: req.body.status ? req.body.status : 1,
    isPayed: req.body.isPayed ? req.body.isPayed : false,
  });

  res.status(200).json(booking);
});
module.exports.updateBooking = asyncHandler(async (req, res) => {
  const { error } = validateUpdateBooking(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }
  if (req.user.id !== booking.userId.toString()) {
    res.status(403).json({ message: "Acces denied, Only for the owner" });
  }
  const updateBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    {
      dateStart: req.body.dateStart,
      dateFin: req.body.dateFin,
      heure: req.body.heure,
      delivery: req.body.delivery,
      driver: req.body.driver,
      isPayOnline: req.body.isPayOnline,
    },
    { new: true }
  );
  res.status(200).json(updateBooking);
});
module.exports.ChangeBookingStatus = asyncHandler(async (req, res) => {
  const { error } = validateUpdateBooking(req.body);
  if (error) {
    return res.status(400).json({ message: error.message });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  const car = await Car.findById(booking.carId);
  if (!car) {
    return res.status(404).json({ message: "Car not found" });
  }

  const location = await Location.findById(car.locationId);
  if (!location) {
    return res.status(404).json({ message: "Location not found" });
  }

  if (
    req.user.role !== 1 &&
    location.managerId.toString() !== req.user.id.toString() &&
    req.user.id !== booking.userId.toString()
  ) {
    return res
      .status(403)
      .json({ message: "Access denied, Only for the owner" });
  }
  if (req.body.status === 2) {
    car.disponible = false;
    booking.isPayed = true;
    await booking.save();
    await car.save();
  }
  if (req.body.status === 3) {
    car.disponible = true;
    booking.isPayed = true;
    await booking.save();
    await car.save();
  }
  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true }
  );

  res.status(200).json(updatedBooking);
});

module.exports.getStatistics = asyncHandler(async (req, res) => {
  try {
    const startOfCurrentWeek = moment().startOf("week").toDate();
    const endOfCurrentWeek = moment().endOf("week").toDate();
    const startOfPreviousWeek = moment()
      .subtract(1, "weeks")
      .startOf("week")
      .toDate();
    const endOfPreviousWeek = moment()
      .subtract(1, "weeks")
      .endOf("week")
      .toDate();

    let totalCustomers,
      totalRequests,
      totalCompleted,
      currentWeekRequests,
      currentWeekCompleted,
      previousWeekRequests,
      previousWeekCompleted;

    if (req.user.role === 2) {
      const location = await Location.findOne({ managerId: req.user.id });
      if (!location) {
        return res
          .status(404)
          .json({ success: false, error: "Location not found" });
      }

      const carsInLocation = await Car.find({ locationId: location._id });
      const carIds = carsInLocation.map((car) => car._id);

      totalCustomers = await User.countDocuments();
      totalRequests = await Booking.countDocuments({
        carId: { $in: carIds },
      });
      totalCompleted = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 3,
      });

      currentWeekRequests = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 1,
        createdAt: { $gte: startOfCurrentWeek, $lt: endOfCurrentWeek },
      });
      currentWeekCompleted = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 3,
        createdAt: { $gte: startOfCurrentWeek, $lt: endOfCurrentWeek },
      });

      previousWeekRequests = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 1,
        createdAt: { $gte: startOfPreviousWeek, $lt: endOfPreviousWeek },
      });
      previousWeekCompleted = await Booking.countDocuments({
        carId: { $in: carIds },
        status: 3,
        createdAt: { $gte: startOfPreviousWeek, $lt: endOfPreviousWeek },
      });
    } else {
      totalCustomers = await User.countDocuments();
      totalRequests = await Booking.countDocuments();
      totalCompleted = await Booking.countDocuments({ status: 3 });

      currentWeekRequests = await Booking.countDocuments({
        status: 1,
        createdAt: { $gte: startOfCurrentWeek, $lt: endOfCurrentWeek },
      });
      currentWeekCompleted = await Booking.countDocuments({
        status: 3,
        createdAt: { $gte: startOfCurrentWeek, $lt: endOfCurrentWeek },
      });

      previousWeekRequests = await Booking.countDocuments({
        status: 1,
        createdAt: { $gte: startOfPreviousWeek, $lt: endOfPreviousWeek },
      });
      previousWeekCompleted = await Booking.countDocuments({
        status: 3,
        createdAt: { $gte: startOfPreviousWeek, $lt: endOfPreviousWeek },
      });
    }

    const requestChange =
      previousWeekRequests === 0
        ? 0
        : ((currentWeekRequests - previousWeekRequests) /
            previousWeekRequests) *
          100;
    const completedChange =
      previousWeekCompleted === 0
        ? 0
        : ((currentWeekCompleted - previousWeekCompleted) /
            previousWeekCompleted) *
          100;

    res.status(200).json({
      totalCustomers,
      totalRequests,
      totalCompleted,
      requestChange: isNaN(requestChange) ? 0 : requestChange,
      completedChange: isNaN(completedChange) ? 0 : completedChange,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports.getRequestsPerCity = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $lookup: {
          from: "cars",
          localField: "carId",
          foreignField: "_id",
          as: "car",
        },
      },
      {
        $unwind: "$car",
      },
      {
        $lookup: {
          from: "locations",
          localField: "car.locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $unwind: "$location",
      },
      {
        $lookup: {
          from: "cities",
          localField: "location.cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      {
        $unwind: "$city",
      },
      {
        $group: {
          _id: "$city.name",
          requests: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          requests: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

module.exports.getRequestsByStatus = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $lookup: {
          from: "cars",
          localField: "carId",
          foreignField: "_id",
          as: "car",
        },
      },
      {
        $unwind: "$car",
      },
      {
        $lookup: {
          from: "locations",
          localField: "car.locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $unwind: "$location",
      },
      {
        $lookup: {
          from: "cities",
          localField: "location.cityId",
          foreignField: "_id",
          as: "city",
        },
      },
      {
        $unwind: "$city",
      },
      {
        $group: {
          _id: {
            city: "$city.name",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.city",
          counts: {
            $push: {
              k: {
                $cond: {
                  if: { $eq: ["$_id.status", 1] },
                  then: "requested",
                  else: {
                    $cond: {
                      if: { $eq: ["$_id.status", 2] },
                      then: "inProgress",
                      else: {
                        $cond: {
                          if: { $eq: ["$_id.status", 3] },
                          then: "completed",
                          else: "canceled",
                        },
                      },
                    },
                  },
                },
              },
              v: "$count",
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          city: "$_id",
          requested: {
            $arrayElemAt: [
              "$counts.v",
              { $indexOfArray: ["$counts.k", "requested"] },
            ],
          },
          inProgress: {
            $arrayElemAt: [
              "$counts.v",
              { $indexOfArray: ["$counts.k", "inProgress"] },
            ],
          },
          completed: {
            $arrayElemAt: [
              "$counts.v",
              { $indexOfArray: ["$counts.k", "completed"] },
            ],
          },
          canceled: {
            $arrayElemAt: [
              "$counts.v",
              { $indexOfArray: ["$counts.k", "canceled"] },
            ],
          },
        },
      },
    ]);

    const formattedResult = result.map((item) => ({
      city: item.city,
      requested: item.requested || 0,
      inProgress: item.inProgress || 0,
      completed: item.completed || 0,
      canceled: item.canceled || 0,
    }));

    res.status(200).json(formattedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
module.exports.getBookingByMonth = async (req, res) => {
  try {
    let bookingsByMonth;
    if (req.user.role === 2) {
      const location = await Location.findOne({ managerId: req.user.id });
      if (!location) {
        return res
          .status(404)
          .json({ success: false, error: "Location not found" });
      }

      bookingsByMonth = await Booking.aggregate([
        {
          $lookup: {
            from: "cars",
            localField: "carId",
            foreignField: "_id",
            as: "car",
          },
        },
        {
          $unwind: "$car",
        },
        {
          $match: { "car.locationId": location._id },
        },
        {
          $group: {
            _id: {
              month: { $month: { $toDate: "$dateStart" } },
              year: { $year: { $toDate: "$dateStart" } },
            },
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", 3] }, 1, 0] } },
            canceled: { $sum: { $cond: [{ $eq: ["$status", 4] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            month: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                  { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                  { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                  { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                  { case: { $eq: ["$_id.month", 5] }, then: "May" },
                  { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                  { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                  { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                  { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                  { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                  { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                  { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                ],
                default: "Unknown",
              },
            },
            count: 1,
            completed: 1,
            canceled: 1,
          },
        },
        {
          $sort: { month: 1 },
        },
      ]);
    } else {
      bookingsByMonth = await Booking.aggregate([
        {
          $group: {
            _id: {
              month: { $month: { $toDate: "$dateStart" } },
              year: { $year: { $toDate: "$dateStart" } },
            },
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ["$status", 3] }, 1, 0] } },
            canceled: { $sum: { $cond: [{ $eq: ["$status", 4] }, 1, 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            month: {
              $switch: {
                branches: [
                  { case: { $eq: ["$_id.month", 1] }, then: "Jan" },
                  { case: { $eq: ["$_id.month", 2] }, then: "Feb" },
                  { case: { $eq: ["$_id.month", 3] }, then: "Mar" },
                  { case: { $eq: ["$_id.month", 4] }, then: "Apr" },
                  { case: { $eq: ["$_id.month", 5] }, then: "May" },
                  { case: { $eq: ["$_id.month", 6] }, then: "Jun" },
                  { case: { $eq: ["$_id.month", 7] }, then: "Jul" },
                  { case: { $eq: ["$_id.month", 8] }, then: "Aug" },
                  { case: { $eq: ["$_id.month", 9] }, then: "Sep" },
                  { case: { $eq: ["$_id.month", 10] }, then: "Oct" },
                  { case: { $eq: ["$_id.month", 11] }, then: "Nov" },
                  { case: { $eq: ["$_id.month", 12] }, then: "Dec" },
                ],
                default: "Unknown",
              },
            },
            count: 1,
            completed: 1,
            canceled: 1,
          },
        },
        {
          $sort: { month: 1 },
        },
      ]);
    }

    res.json(bookingsByMonth);
  } catch (error) {
    console.error("Error fetching booking data by month:", error);
    res.status(500).json({ error: "Server Error" });
  }
};
module.exports.getBookingCountByBrand = asyncHandler(async (req, res) => {
  try {
    let result;
    if (req.user.role === 2) {
      const location = await Location.findOne({ managerId: req.user.id });
      if (!location) {
        return res
          .status(404)
          .json({ success: false, error: "Location not found" });
      }
      result = await Booking.aggregate([
        {
          $lookup: {
            from: "cars",
            localField: "carId",
            foreignField: "_id",
            as: "car",
          },
        },
        {
          $unwind: "$car",
        },
        {
          $match: { "car.locationId": location._id },
        },
        {
          $group: {
            _id: "$car.brand",
            totalBookings: { $sum: 1 },
          },
        },
        {
          $sort: { totalBookings: -1 },
        },
      ]);
    } else {
      result = await Booking.aggregate([
        {
          $lookup: {
            from: "cars",
            localField: "carId",
            foreignField: "_id",
            as: "car",
          },
        },
        {
          $unwind: "$car",
        },
        {
          $group: {
            _id: "$car.brand",
            totalBookings: { $sum: 1 },
          },
        },
        {
          $sort: { totalBookings: -1 },
        },
      ]);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to fetch booking counts by brand:", error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports.getRequestsPerLocation = async (req, res) => {
  try {
    const result = await Booking.aggregate([
      {
        $lookup: {
          from: "cars",
          localField: "carId",
          foreignField: "_id",
          as: "car",
        },
      },
      {
        $unwind: "$car",
      },
      {
        $lookup: {
          from: "locations",
          localField: "car.locationId",
          foreignField: "_id",
          as: "location",
        },
      },
      {
        $unwind: "$location",
      },
      {
        $group: {
          _id: {
            location: "$location.name",
            status: "$status",
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.location",
          totalBookings: { $sum: "$count" },
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count",
            },
          },
          requested: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", 1] }, "$count", 0],
            },
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", 2] }, "$count", 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", 3] }, "$count", 0],
            },
          },
          canceled: {
            $sum: {
              $cond: [{ $eq: ["$_id.status", 4] }, "$count", 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          location: "$_id",
          totalBookings: 1,
          requested: 1,
          completed: 1,
          inProgress: 1,
          canceled: 1,
        },
      },
    ]);

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

module.exports.getAllPayedBookings = asyncHandler(async (req, res) => {
  const { page, bookingId, paymentType } = req.query;
  let bookings;
  let countBooking;

  const query = { isPayed: true };

  if (bookingId) {
    query._id = bookingId;
  }

  if (paymentType === "cash") {
    query.isPayOnline = false;
  } else if (paymentType === "online") {
    query.isPayOnline = true;
  }

  if (req.user.role === 2) {
    const location = await Location.findOne({ managerId: req.user.id });

    if (location) {
      const carsInLocation = await Car.find({ locationId: location._id });
      const carIds = carsInLocation.map((car) => car._id);
      query.carId = { $in: carIds };
    } else {
      return res.status(200).json({ count: 0, bookings: [] });
    }
  }

  if (page) {
    bookings = await Booking.find(query)
      .skip((page - 1) * ADMIN_PER_PAGE)
      .limit(ADMIN_PER_PAGE)
      .sort({ createdAt: -1 })
      .populate({
        path: "carId",
        populate: {
          path: "locationId",
          populate: {
            path: "cityId",
          },
        },
      })
      .populate("userId");
    countBooking = await Booking.countDocuments(query);
  } else {
    bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: "carId",
        populate: {
          path: "locationId",
          populate: {
            path: "cityId",
          },
        },
      })
      .populate("userId");
    countBooking = await Booking.countDocuments(query);
  }

  res.status(200).json({ count: countBooking, bookings: bookings });
});
