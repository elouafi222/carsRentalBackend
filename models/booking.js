const mongoose = require("mongoose");
const joi = require("joi");
const BookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true,
    },
    dateStart: {
      type: String,
      required: true,
    },
    dateFin: {
      type: String,
      required: true,
    },
    heure: {
      type: String,
      required: true,
    },
    delivery: {
      type: Boolean,
      default: false,
    },
    driver: {
      type: Boolean,
      default: false,
    },
    isPayOnline: {
      type: Boolean,
      default: false,
    },
    isPayed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model("Booking", BookingSchema);

function validateBooking(obj) {
  const schema = joi.object({
    carId: joi.string().required(),
    dateStart: joi.string().required(),
    dateFin: joi.string().required(),
    heure: joi.string().required(),
    delivery: joi.boolean().required(),
    driver: joi.boolean().required(),
    isPayOnline: joi.boolean().required(),
    isPayed: joi.boolean().required(),
    status: joi.number().integer(),
  });
  return schema.validate(obj);
}

function validateUpdateBooking(obj) {
  const schema = joi.object({
    dateStart: joi.string(),
    dateFin: joi.string(),
    heure: joi.string(),
    delivery: joi.boolean(),
    driver: joi.boolean(),
    isPayed: joi.boolean(),
    isPayOnline: joi.boolean(),
    status: joi.number().integer(),
  });
  return schema.validate(obj);
}
module.exports = {
  Booking,
  validateBooking,
  validateUpdateBooking,
};
