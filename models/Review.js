const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    text: {
      type: String,
      required: true,
    },
    lovedBy: {
      type: [String], // Array of user emails or device IDs
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
