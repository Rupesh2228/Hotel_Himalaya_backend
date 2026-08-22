const express = require("express");
const reviewController = require("../controllers/reviewController");
const validate = require('../middleware/validate');
const { createReviewValidator, loveReviewValidator } = require('../validators/review.validator');

const router = express.Router();

// Get all reviews
router.get("/", reviewController.getAllReviews);

// Create a new review
router.post("/", createReviewValidator, validate, reviewController.createReview);

// Update review (add/remove love)
router.put("/:reviewId/love", loveReviewValidator, validate, reviewController.updateReviewLoves);

// Delete a review
router.delete("/:reviewId", reviewController.deleteReview);

module.exports = router;
