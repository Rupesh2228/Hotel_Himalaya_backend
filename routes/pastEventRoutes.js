const express = require("express");
const router = express.Router();
const { getPastEvents, createPastEvent, updatePastEvent, deletePastEvent } = require("../controllers/pastEventController");
const { protect } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/adminMiddleware");

router.route("/")
  .get(getPastEvents)
  .post(protect, isAdmin, createPastEvent);

router.route("/:id")
  .put(protect, isAdmin, updatePastEvent)
  .delete(protect, isAdmin, deletePastEvent);

module.exports = router;
