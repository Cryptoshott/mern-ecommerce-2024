const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: 'dam0swaaq',
  api_key: '185554684825193',
  api_secret: '2VKNbaREyJ0y2ggJUIxT8v0suJg',
});

const storage = new multer.memoryStorage();

async function imageUploadUtil(file) {
  const result = await cloudinary.uploader.upload(file, {
    resource_type: 'auto',
  });

  return result;
}

const upload = multer({ storage });

module.exports = { upload, imageUploadUtil };
