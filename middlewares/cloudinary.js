const { config, uploader } = require("cloudinary").v2;
const multer = require("multer");
const DatauriParser = require("datauri/parser");
const path = require("path");

const cloudinaryConfig = () => {
    config({
        cloud_name: process.env.cloudinary_name,
        api_key: process.env.cloudinary_api_key,
        api_secret: process.env.cloudinary_api_secret,
        secure: true
    });
};

const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single("image");

const dataUri = req => {
    const parser = new DatauriParser();
    return parser.format(
        path.extname(req.file.originalname).toString(),
        req.file.buffer
    ).content;
};

module.exports = { cloudinaryConfig, multerUploads, dataUri, uploader };
