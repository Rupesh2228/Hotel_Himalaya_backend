const express = require("express");
const router = express.Router();
const { getPastEvents, createPastEvent, updatePastEvent, deletePastEvent } = require("../controllers/pastEventController");
const { protect, admin } = require("../middleware/authMiddleware");

router.route("/")
  .get(getPastEvents)
  .post(protect, admin, createPastEvent);

router.route("/:id")
  .put(protect, admin, updatePastEvent)
  .delete(protect, admin, deletePastEvent);

module.exports = router;
