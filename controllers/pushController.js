const PushSubscription = require('../models/PushSubscription');

exports.getPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return res.status(503).json({ error: 'Push notifications are not configured' });
  res.json({ publicKey });
};

exports.subscribe = async (req, res) => {
  try {
    const subscription = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'A valid browser push subscription is required' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId: req.user._id, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ message: 'Device notifications enabled' });
  } catch (error) {
    console.error('push subscribe error:', error);
    res.status(500).json({ error: 'Failed to enable device notifications' });
  }
};
