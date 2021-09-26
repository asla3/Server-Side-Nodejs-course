var express = require('express');
var User = require('../models/user');
var router = express.Router();
router.use(express.json());
var passport = require('passport');
var authenticate = require('../authenticate');

router.get(
	'/',
	authenticate.verifyUser,
	authenticate.verifyAdmin,
	function (req, res, next) {
		User.find({})
			.then((users) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json(users);
			})
			.catch((err) => next(err));
	}
);

router.post('/signup', (req, res, next) => {
	User.register(
		new User({ username: req.body.username }),
		req.body.password,
		(err, user) => {
			if (err) {
				res.statusCode = 500;
				res.setHeader('Content-Type', 'application/json');
				res.json({ err: err });
			} else {
				// add first name to the user after it's been created in the database
				if (req.body.firstName) {
					user.firstName = req.body.firstName;
				}
				// add last name to the user after it's been created in the database
				if (req.body.lastName) {
					user.lastName = req.body.lastName;
				}
				// save user with new fields
				user.save((err, user) => {
					if (err) {
						// send error back to the client
						res.statusCode = 500;
						res.setHeader('Content-Type', 'application/json');
						console.log(err);
						res.json({ err: err });
						return;
					}
					passport.authenticate('local')(req, res, () => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json({ success: true, status: 'Registration Successful!' });
					});
				});
			}
		}
	);
});

router.post(
	'/login',
	passport.authenticate('local'),
	function (req, res, next) {
		var token = authenticate.getToken({ _id: req.user._id });
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json({
			success: true,
			token: token,
			status: 'Registration Successful!',
		});
	}
);

router.get('/logout', function (req, res) {
	// check that the current session is valid
	if (req.session) {
		req.session.destroy();
		res.clearCookie('session-id');
		res.redirect('/');
	} else {
		var err = new Error('You are not logged in!');
		err.status = 403;
		next(err);
	}
});

module.exports = router;
