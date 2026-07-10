const express = require("express");
const reviewController = require("../controllers/reviewController");

const router = express.Router();

// Get all reviews
router.get("/", reviewController.getAllReviews);

// Create a new review
router.post("/", reviewController.createReview);

// Update review (add/remove love)
router.put("/:reviewId/love", reviewController.updateReviewLoves);

// Delete a review
router.delete("/:reviewId", reviewController.deleteReview);

module.exports = router;
