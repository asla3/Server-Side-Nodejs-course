var express = require('express');
var User = require('../models/user');
var router = express.Router();
router.use(express.json());

router.get('/', function (req, res, next) {
	res.send('respond with a resource');
});

router.post('/signup', (req, res, next) => {
	User.findOne({ username: req.body.username })
		.then((user) => {
			// if there's an user with that username already registered, throw an error
			if (user != null) {
				var err = new Error('User ' + req.body.username + ' already exists!');
				err.status = 403;
				next(err);
			}
			// if not, create it
			else {
				return User.create({
					username: req.body.username,
					password: req.body.password,
				});
			}
		})
		.then(
			(user) => {
				res.statusCode = 200;
				res.setHeader('Content-Type', 'application/json');
				res.json({ status: 'Registration Successful!', user: user });
			},
			(err) => next(err)
		)
		.catch((err) => next(err));
});

router.post('/login', function (req, res, next) {
	// check if the request didn't include a session with a value of user
	if (!req.session.user) {
		var authHeader = req.headers.authorization;
		// if the authroziation header is not present, ask the user to signin before proceeding
		if (!authHeader) {
			var err = new Error('You are not authenticated!');
			res.setHeader('WWW-Authenticate', 'Basic');
			err.status = 401;
			return next(err);
		}
		// get the authorization header and decrypt it
		var auth = Buffer.from(authHeader.split(' ')[1], 'base64')
			.toString()
			.split(':');

		var username = auth[0];
		var password = auth[1];

		User.findOne({ username: username })
			.then((user) => {
				if (user === null) {
					var err = new Error('User ' + username + ' does not exist');
					err.status = 403;
					return next(err);
				} else if (user.password !== password) {
					var err = new Error('Incorrect password.');
					err.status = 403;
					return next(err);
				} else if (user.username === username && user.password === password) {
					// create the session
					req.session.user = 'authenticated';
					res.statusCode = 200;
					res.setHeader('Content-Type', 'text/plain');
					res.end('You are authenticated');
				}
			})
			.catch((err) => next(err));
	}
	// if it did contain a session with an user, then user is already athenticated and there's no need to do anything
	else {
		res.statusCode = 200;
		res.setHeader('Content-Type', 'text/plain');
		res.end('You are already authenticated!');
	}
});

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
