const express = require('express');
const authenticate = require('../authenticate');
const multer = require('multer');
// configuration for the way images uploaded by users are stored
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'public/images');
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});

// filter to make sure the file uploaded is a valid image
const imageFileFilter = (req, file, cb) => {
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
		return cb(new Error("You can't upload this image format"), false);
	}
	cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFileFilter });

const uploadRouter = express.Router();

uploadRouter.use(express.json());

uploadRouter
	.route('/')
	.get(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.end('GET operation not supported on /imageUpload');
	})
	.post(
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		upload.single('imageFile'),
		(req, res) => {
			res.statusCode = 200;
			res.setHeader('Content-Type', 'application/json');
			res.json(req.file);
		}
	)
	.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.end('PUT operation not supported on /imageUpload');
	})
	.delete(
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		(req, res, next) => {
			res.statusCode = 403;
			res.end('DELETE operation not supported on /imageUpload');
		}
	);

module.exports = uploadRouter;
