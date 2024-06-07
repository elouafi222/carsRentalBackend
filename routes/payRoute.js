const { pay } = require("../controllers/paymentController");

const router = require("express").Router();
router.route("/").post(pay);
module.exports = router;
