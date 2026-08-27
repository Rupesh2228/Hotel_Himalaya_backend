const Review = require("../models/Review");
const { createAdminNotification } = require('../services/notificationService');
const { sendAdminEmail } = require('../services/email.service');
const adminNotificationTemplate = require('../templates/adminNotification.template');

// Get all reviews
exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// Create a new review
exports.createReview = async (req, res) => {
  try {
    const { author, email, rating, text } = req.body;

    if (!author || !rating || !text) {
      return res
        .status(400)
        .json({ error: "Author, rating, and text are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const review = new Review({
      author,
      email: email || null,
      rating,
      text,
    });

    const savedReview = await review.save();

    // Respond immediately to the client
    res.status(201).json(savedReview);

    // Send notifications and emails in background
    (async () => {
      // 1. Admin push/socket notification
      try {
        await createAdminNotification({
          type: 'review',
          title: `New Review by ${savedReview.author}`,
          message: `${savedReview.author} rated ${savedReview.rating}/5 — ${savedReview.text.slice(0, 120)}`,
          link: `/hh-cp-9f3m2q`,
        });
      } catch (e) {
        console.error('Failed to queue admin review notification:', e && e.message ? e.message : e);
      }

      // 2. Admin email notification
      try {
        const details = {
          'Author': savedReview.author,
          'Email': savedReview.email || 'N/A',
          'Rating': `${savedReview.rating} / 5`,
          'Review': savedReview.text.slice(0, 300),
        };
        const adminHtml = adminNotificationTemplate('review', details);
        await sendAdminEmail(
          `⭐ New Review (${savedReview.rating}/5) by ${savedReview.author}`,
          `${savedReview.author} left a ${savedReview.rating}/5 review: ${savedReview.text.slice(0, 200)}`,
          adminHtml
        );
      } catch (adminEmailErr) {
        console.error('[EMAIL-ERROR] Admin review email failed:', adminEmailErr.message);
      }
    })().catch((bgErr) => console.error('[REVIEW-BG-ERROR]', bgErr.message));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// Update review (add love/like)
exports.updateReviewLoves = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { identifier } = req.body; // email or device ID

    if (!identifier) {
      return res.status(400).json({ error: "Identifier is required" });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const lovedBy = review.lovedBy || [];
    const alreadyLoved = lovedBy.includes(identifier);

    if (alreadyLoved) {
      review.lovedBy = lovedBy.filter((id) => id !== identifier);
    } else {
      review.lovedBy = [...lovedBy, identifier];
    }

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

// Delete a review (admin only)
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};
