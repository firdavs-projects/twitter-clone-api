const config = require("config");
const cloudinary = require("cloudinary");

const connectStorage = async () => {
  try {
    await cloudinary.config({
      cloud_name: config.get('cloud_name'),
      api_key: config.get('api_key'),
      api_secret: config.get('api_secret'),
    });
    console.log('Connected to the Cloudinary')
  } catch (e) {
    console.error('Cloudinary Error', e.message)
    process.exit(1)
  }
}

module.exports = connectStorage
