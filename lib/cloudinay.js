const cloudinary = require("cloudinary");
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_USER_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const cloudinaryUploadImage = async (fileToUpload) => {
  try {
    const data = await cloudinary.uploader.upload(fileToUpload, {
      resource_type: "auto",
    });
    return data;
  } catch (error) {
    throw new Error("Internal Server Error !");
    console.log(error);
  }
};
const cloudinaryRemoveImage = async (imagePublicId) => {
  try {
    const result = await cloudinary.uploader.destroy(imagePublicId);
    return result;
  } catch (error) {
    throw new Error("Internal Server Error !");
    console.log(error);
  }
};
const cloudinaryRemoveAllImage = async (imagePublicIds) => {
  try {
    const result = await cloudinary.v2.api.delete_resources(imagePublicIds);
    return result;
  } catch (error) {
    throw new Error("Internal Server Error !");
    console.log(error);
  }
};
module.exports = {
  cloudinaryRemoveImage,
  cloudinaryUploadImage,
  cloudinaryRemoveAllImage,
};
