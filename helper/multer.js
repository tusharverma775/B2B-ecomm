
const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destinationFolder = '';
    if (file.mimetype.startsWith('image/')) {
      destinationFolder = path.join(__dirname, '../public/images');
    } else {
      console.log('Unsupported file type');
      return cb(new Error('Unsupported file type'));
    }

    cb(null, destinationFolder);
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).fields([
  { name: 'images', maxCount: 10 },
  
  
]);

module.exports = upload;
