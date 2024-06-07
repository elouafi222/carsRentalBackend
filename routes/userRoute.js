const {
  getAllUsers,
  getSingleUser,
  updateProfile,
  deteleProfile,
} = require("../controllers/userController");
const validateId = require("../middlewares/validateId");
const {
  verifyTokenAndAdmin,
  verifyToken,
} = require("../middlewares/verifyToken");

const router = require("express").Router();
router.route("/").get(verifyTokenAndAdmin, getAllUsers);
router
  .route("/:id")
  .get(validateId ,verifyToken, getSingleUser)
  .put(validateId ,verifyToken, updateProfile)
  .delete(validateId ,verifyToken, deteleProfile);
module.exports = router;
