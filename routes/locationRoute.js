const {
  addLocation,
  getAllLocations,
  getSingleLocation,
  updateLocation,
  deleteLocation,
} = require("../controllers/locationController");
const validateId = require("../middlewares/validateId");
const {
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

const router = require("express").Router();

router.route("/").post(verifyTokenAndAdmin, addLocation).get(getAllLocations);

router
  .route("/:id")
  .get(validateId, verifyTokenAndAdmin, getSingleLocation)
  .put(validateId, verifyTokenAndAdmin, updateLocation)
  .delete(validateId, verifyTokenAndAdmin, deleteLocation);
module.exports = router;
