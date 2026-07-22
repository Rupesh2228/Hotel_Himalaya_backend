const PastEvent = require("../models/PastEvent");

// Get all past events
const getPastEvents = async (req, res) => {
  try {
    const pastEvents = await PastEvent.find().sort({ createdAt: -1 });
    res.json(pastEvents);
  } catch (err) {
    console.error("Error fetching past events:", err);
    res.status(500).json({ error: "Server error fetching past events" });
  }
};

// Create a new past event (Admin only)
const createPastEvent = async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    
    if (!title || !description || !imageUrl) {
      return res.status(400).json({ error: "Title, description, and imageUrl are required" });
    }

    const newPastEvent = await PastEvent.create({
      title,
      description,
      imageUrl
    });

    res.status(201).json(newPastEvent);
  } catch (err) {
    console.error("Error creating past event:", err);
    res.status(500).json({ error: "Server error creating past event" });
  }
};

// Update a past event (Admin only)
const updatePastEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, imageUrl } = req.body;

    const updatedEvent = await PastEvent.findByIdAndUpdate(
      id,
      { title, description, imageUrl },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: "Past event not found" });
    }

    res.json(updatedEvent);
  } catch (err) {
    console.error("Error updating past event:", err);
    res.status(500).json({ error: "Server error updating past event" });
  }
};

// Delete a past event (Admin only)
const deletePastEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await PastEvent.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ error: "Past event not found" });
    }

    res.json({ message: "Past event deleted successfully" });
  } catch (err) {
    console.error("Error deleting past event:", err);
    res.status(500).json({ error: "Server error deleting past event" });
  }
};

module.exports = {
  getPastEvents,
  createPastEvent,
  updatePastEvent,
  deletePastEvent
};
