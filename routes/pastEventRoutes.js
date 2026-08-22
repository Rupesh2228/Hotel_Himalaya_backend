const express = require("express");
const router = express.Router();
const { getPastEvents, createPastEvent, updatePastEvent, deletePastEvent } = require("../controllers/pastEventController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const { createPastEventValidator, updatePastEventValidator } = require("../validators/pastEvent.validator");

router.route("/")
  .get(getPastEvents)
  .post(protect, isAdmin, createPastEventValidator, validate, createPastEvent);

router.route("/:id")
  .put(protect, isAdmin, updatePastEventValidator, validate, updatePastEvent)
  .delete(protect, isAdmin, deletePastEvent);

module.exports = router;
