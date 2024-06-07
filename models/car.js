const mongoose = require("mongoose");
const joi = require("joi");
const CarSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    transmission: {
      type: String,
      required: true,
    },
    fuel: {
      type: String,
      required: true,
    },
    seats: {
      type: Number,
      default: 4,
      required: true,
    },
    disponible: {
      type: Boolean,
      default: true,
    },
    image: { type: Object, url: { type: String }, publicId: { type: String } },
    rating: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rateStars: { type: Number, required: true },
      },
    ],
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Car = mongoose.model("Car", CarSchema);

function validateAddCar(obj) {
  const schema = joi.object({
    brand: joi.string().trim().required(),
    model: joi.string().trim().required(),
    price: joi.number().integer().required(),
    transmission: joi.string().trim().required(),
    fuel: joi.string().trim().required(),
    seats: joi.number().integer().required(),
    locationId: joi.string().trim(),
  });
  return schema.validate(obj);
}

function validateUpdateCar(obj) {
  const schema = joi.object({
    brand: joi.string().trim(),
    model: joi.string().trim(),
    price: joi.number().integer(),
    transmission: joi.string().trim(),
    fuel: joi.string().trim(),
    seats: joi.number().integer(),
    disponible: joi.boolean(),
  });
  return schema.validate(obj);
}

module.exports = {
  Car,
  validateAddCar,
  validateUpdateCar,
};
