const joi = require("joi");
const mongoose = require("mongoose");
const CitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
CitySchema.virtual("locations", {
  ref: "Location",
  foreignField: "cityId",
  localField: "_id",
});
const City = mongoose.model("City", CitySchema);
function validateAddCity(obj) {
  const schema = joi.object({
    name: joi.string().required(),
  });
  return schema.validate(obj);
}
module.exports = {
  City,
  validateAddCity,
};
