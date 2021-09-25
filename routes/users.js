var express = require('express');
var User = require('../models/user');
var router = express.Router();
router.use(express.json());
var passport = require('passport');

router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
	User.register(
		new User({ username: req.body.username }),
		req.body.password,
		(err, user) => {
			// if there's an user with that username already registered, throw an error
			if (err) {
				var err = new Error('User ' + req.body.username + ' already exists!');
				err.status = 503;
				res.setHeader('Content-Type', 'application/json');

				res.json({ err: err });
			}
			// if not, create it
			else {
				passport.authenticate('local')(req, res, () => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json({ success: true, status: 'Registration Successful!' });
				});
			}
		}
	);
});

router.post(
	'/login',
	passport.authenticate('local'),
	function (req, res, next) {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'application/json');
		res.json({ success: true, status: 'You have successfully logged in!' });
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
