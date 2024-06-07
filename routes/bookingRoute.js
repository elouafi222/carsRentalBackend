const {
  booking,
  getAllBookings,
  ChangeBookingStatus,
  updateBooking,
  getAllBookingsRequests,
  getStatistics,
  getRequestsPerCity,
  getRequestsByStatus,
  getBookingByMonth,
  getBookingCountByBrand,
  getRequestsPerLocation,
  getAllPayedBookings,
} = require("../controllers/bookingController");
const validateId = require("../middlewares/validateId");
const {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAndAdminAndManager,
} = require("../middlewares/verifyToken");

const router = require("express").Router();

router
  .route("/")
  .post(verifyToken, booking)
  .get(verifyTokenAndAdminAndManager, getAllBookings);
router
  .route("/requests")
  .get(verifyTokenAndAdminAndManager, getAllBookingsRequests);

router.route("/status/:id").put(verifyToken, ChangeBookingStatus);
router.route("/:id").put(validateId, verifyToken, updateBooking);

router.route("/statistics").get(verifyTokenAndAdminAndManager, getStatistics);
router.route("/requestsByCity").get(verifyTokenAndAdmin, getRequestsPerCity);
router
  .route("/requestsByLocation")
  .get(verifyTokenAndAdmin, getRequestsPerLocation);
router
  .route("/requestsByStatus")
  .get(verifyTokenAndAdminAndManager, getRequestsByStatus);
router
  .route("/requestsByMonth")
  .get(verifyTokenAndAdminAndManager, getBookingByMonth);
router
  .route("/bookingsByBrand")
  .get(verifyTokenAndAdminAndManager, getBookingCountByBrand);
router
  .route("/payedBookings")
  .get(verifyTokenAndAdminAndManager, getAllPayedBookings);

module.exports = router;
