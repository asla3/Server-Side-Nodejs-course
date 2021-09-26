const express = require('express');
const authenticate = require('../authenticate');

const Dishes = require('../models/dishes');

const dishRouter = express.Router();

dishRouter.use(express.json());

dishRouter
	.route('/')
	.get((req, res, next) => {
		Dishes.find({})
			// popuplate the author field
			.populate('comments.author')
			.then(
				(dishes) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(dishes);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		Dishes.create(req.body)
			.then(
				(dish) => {
					console.log('Dish created', dish);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(dish);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.end('PUT operation not supported on /dishes');
	})
	.delete(
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		(req, res, next) => {
			Dishes.remove({})
				.then(
					(resp) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(resp);
					},
					(err) => next(err)
				)
				.catch((err) => next(err));
		}
	);

dishRouter
	.route('/:dishId')
	.get((req, res, next) => {
		Dishes.findById(req.params.dishId)
			// populate the author field for comments
			.populate('comments.author')
			.then(
				(dish) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(dish);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.post(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		res.statusCode = 403;
		res.end('POST operation not supported on /dishes/' + req.params.dishId);
	})
	.put(authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
		Dishes.findByIdAndUpdate(
			// id of the item to update
			req.params.dishId,
			// fields to update
			{
				$set: req.body,
			},
			{ new: true }
		)
			.then(
				(dish) => {
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					res.json(dish);
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.delete(
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		(req, res, next) => {
			Dishes.findByIdAndRemove(req.params.dishId)
				.then(
					(dish) => {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(dish);
					},
					(err) => next(err)
				)
				.catch((err) => next(err));
		}
	);

dishRouter
	.route('/:dishId/comments')
	.get((req, res, next) => {
		Dishes.findById(req.params.dishId)
			.populate('comments.author')
			.then(
				(dish) => {
					// check that the dish exists
					if (dish != null) {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(dish.comments);
					} else {
						err = new Error('Dish ' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.post(authenticate.verifyUser, (req, res, next) => {
		Dishes.findById(req.params.dishId)
			.then(
				(dish) => {
					// checks that the dish exists
					if (dish != null) {
						// get the user from the request and add that to the body
						req.body.author = req.user._id;
						dish.comments.push(req.body);
						// save the dish with the autor field
						dish
							.save()
							// return the dish
							.then(
								(dish) => {
									Dishes.findById(dish._id)
										.populate('comments.author')
										.then((dish) => {
											res.statusCode = 200;
											res.setHeader('Content-Type', 'application/json');
											res.json(dish.comments);
										});
								},
								(err) => next(err)
							);
					} else {
						err = new Error('Dish ' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.put(authenticate.verifyUser, (req, res, next) => {
		res.statusCode = 403;
		res.end(
			'PUT operation not supported on /dishes/' +
				req.params.dishId +
				'/comments'
		);
	})
	.delete(
		authenticate.verifyUser,
		authenticate.verifyAdmin,
		(req, res, next) => {
			Dishes.findById(req.params.dishId)
				.then(
					(dish) => {
						// check that the dish exists
						if (dish != null) {
							// delete all the comments
							for (var i = dish.comments.length - 1; i >= 0; i--) {
								dish.comments.id(dish.comments[i]._id).remove();
							}
							dish.save().then(
								(dish) => {
									res.statusCode = 200;
									res.setHeader('Content-Type', 'application/json');
									res.json(dish.comments);
								},
								(err) => next(err)
							);
						} else {
							err = new Error('Dish ' + req.params.dishId + ' not found');
							err.status = 404;
							return next(err);
						}
					},
					(err) => next(err)
				)
				.catch((err) => next(err));
		}
	);

dishRouter
	.route('/:dishId/comments/:commentId')
	.get((req, res, next) => {
		Dishes.findById(req.params.dishId)
			.populate('comments.author')
			.then(
				(dish) => {
					// check that the dish exists and so does the comment user wants to get
					if (dish != null && dish.comments.id(req.params.commentId) != null) {
						res.statusCode = 200;
						res.setHeader('Content-Type', 'application/json');
						res.json(dish.comments.id(req.params.commentId));
					} else if (dish == null) {
						err = new Error('Dish ' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					} else {
						err = new Error('Comment ' + req.params.commentId + ' not found');
						err.status = 404;
						return next(err);
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.post(authenticate.verifyUser, (req, res, next) => {
		res.statusCode = 403;
		res.end(
			'POST operation not supported on /dishes/' +
				req.params.dishId +
				'comments/' +
				req.params.commentId
		);
	})
	.put(authenticate.verifyUser, (req, res, next) => {
		console.log(JSON.stringify(req.user));
		Dishes.findById(req.params.dishId)
			.then(
				(dish) => {
					// checks that the user and the comment exists
					if (dish != null && dish.comments.id(req.params.commentId) != null) {
						// check that the user that is trying to modify the comment is actually the one that created it
						if (
							req.user._id.equals(dish.comments.id(req.params.commentId).author)
						) {
							// just update the ratings and document field of the comment
							if (req.body.rating) {
								dish.comments.id(req.params.commentId).rating = req.body.rating;
							}
							if (req.body.comment) {
								dish.comments.id(req.params.commentId).comment =
									req.body.comment;
							}
							dish.save().then(
								(dish) => {
									Dishes.findById(dish._id)
										.populate('comments.author')
										.then((dish) => {
											res.statusCode = 200;
											res.setHeader('Content-Type', 'application/json');
											res.json(dish);
										});
								},
								(err) => next(err)
							);
						}
						// send back error if the user is not allowed to modify the comment
						else {
							const err = new Error(
								'You are not allowed to perform this operation'
							);
							err.status = 403;
							return next(err);
						}
					} else if (dish == null) {
						err = new Error('Dish ' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					} else {
						err = new Error('Comment ' + req.params.commentId + ' not found');
						err.status = 404;
						return next(err);
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	})
	.delete(authenticate.verifyUser, (req, res, next) => {
		Dishes.findById(req.params.dishId)
			.then(
				(dish) => {
					// check that the dish and the comment does exist
					if (dish != null && dish.comments.id(req.params.commentId)) {
						// check that who's trying to modify this comment is allowed to modify it
						if (
							req.user._id.equals(dish.comments.id(req.params.commentId).author)
						) {
							dish.comments.id(req.params.commentId).remove();
							// save the dish without the comment
							dish.save().then(
								(dish) => {
									Dishes.findById(dish._id)
										.populate('comments.author')
										.then((dish) => {
											res.statusCode = 200;
											res.setHeader('Content-Type', 'application/json');
											res.json(dish.comments);
										});
								},
								(err) => next(err)
							);
						}
						// if it's not allowed then just send back an error
						else {
							const err = new Error(
								'You are not allowed to perform this operation'
							);
							err.status = 403;
							return next(err);
						}
					} else if (dish == null) {
						err = new Error('Dish ' + req.params.dishId + ' not found');
						err.status = 404;
						return next(err);
					} else {
						err = new Error('Comment ' + req.params.commentId + ' not found');
						err.status = 404;
						return next(err);
					}
				},
				(err) => next(err)
			)
			.catch((err) => next(err));
	});

module.exports = dishRouter;
