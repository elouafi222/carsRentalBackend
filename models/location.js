const mongoose = require("mongoose");
const joi = require("joi");
const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    adresse: {
      type: String,
      required: true,
      trim: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
LocationSchema.virtual("cars", {
  ref: "Car",
  foreignField: "locationId",
  localField: "_id",
});
const Location = mongoose.model("Location", LocationSchema);

function validateAddLocation(obj) {
  const schema = joi.object({
    name: joi.string().trim().required(),
    phone: joi.string().trim().required(),
    adresse: joi.string().trim().required(),
    managerId: joi.string().required(),
    cityId: joi.string().required(),
  });
  return schema.validate(obj);
}
function validateUpdateLocation(obj) {
  const schema = joi.object({
    adresse: joi.string().trim(),
    name: joi.string().trim(),
    phone: joi.string().trim(),
    cityId: joi.string(),
    managerId: joi.string(),
  });
  return schema.validate(obj);
}

module.exports = {
  Location,
  validateAddLocation,
  validateUpdateLocation,
};
