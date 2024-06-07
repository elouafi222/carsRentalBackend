const {
  addCity,
  getAllCities,
  updateCity,
  deleteCity,
} = require("../controllers/cityController");
const validateId = require("../middlewares/validateId");
const { verifyTokenAndAdmin } = require("../middlewares/verifyToken");

const router = require("express").Router();
router
  .route("/")
  .post(verifyTokenAndAdmin, addCity)
  .get(verifyTokenAndAdmin, getAllCities);
router
  .route("/:id")
  .delete(validateId, verifyTokenAndAdmin, deleteCity)
  .put(validateId, verifyTokenAndAdmin, updateCity);
module.exports = router;
