const {
  addCar,
  getAllCars,
  getSingleCar,
  updateCar,
  updateCarImage,
  deleteCar,
  rateCar,
  getAllCarBrands,
  getAllCarCities,
  changeDisponibility,
  getAllCarsForAdminstrations,
  getTopRatedCars,
  getBookingsByBrand,
} = require("../controllers/carController");
const photoUpload = require("../middlewares/uploadPhoto");
const validateId = require("../middlewares/validateId");
const {
  verifyTokenAndAdminAndManager,
  verifyToken,
} = require("../middlewares/verifyToken");

const router = require("express").Router();

router
  .route("/")
  .post(verifyTokenAndAdminAndManager, photoUpload.single("image"), addCar)
  .get(getAllCars);

router
  .route("/administrations")
  .get(verifyTokenAndAdminAndManager, getAllCarsForAdminstrations);

router.route("/brands").get(getAllCarBrands);
router.route("/cities").get(getAllCarCities);
router
  .route("/topRatedCar")
  .get(verifyTokenAndAdminAndManager, getTopRatedCars);

router
  .route("/:id")
  .get(validateId, getSingleCar)
  .put(validateId, verifyTokenAndAdminAndManager, updateCar)
  .delete(validateId, verifyTokenAndAdminAndManager, deleteCar);

router
  .route("/car-image-update/:id")
  .put(
    validateId,
    verifyTokenAndAdminAndManager,
    photoUpload.single("image"),
    updateCarImage
  );

router.route("/rate/:id").put(validateId, verifyToken, rateCar);
router
  .route("/disponible/:id")
  .put(validateId, verifyTokenAndAdminAndManager, changeDisponibility);

module.exports = router;
