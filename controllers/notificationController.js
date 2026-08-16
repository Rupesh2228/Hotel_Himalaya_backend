const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json(notifications);
  } catch (err) {
    console.error('getNotifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findById(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    notif.read = true;
    notif.isRead = true;
    await notif.save();
    res.json({ message: 'Marked as read', data: notif });
  } catch (err) {
    console.error('markAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({}, { $set: { read: true, isRead: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('markAllAsRead error:', err);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findByIdAndDelete(id);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
