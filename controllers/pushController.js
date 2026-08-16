const PushSubscription = require('../models/PushSubscription');

exports.getPublicKey = (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey) return res.status(503).json({ error: 'Push notifications are not configured on this server' });
  res.json({ publicKey });
};

exports.subscribe = async (req, res) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'A valid browser push subscription is required (endpoint + keys)' });
    }

    const sub = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId: req.user._id,
        adminId: req.user._id,
        endpoint,
        keys
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`[PUSH] Admin ${req.user.email} subscribed to push notifications`);
    res.status(201).json({ message: 'Desktop notifications enabled successfully', subscriptionId: sub._id });
  } catch (error) {
    console.error('push subscribe error:', error);
    res.status(500).json({ error: 'Failed to enable desktop notifications' });
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Subscription endpoint is required' });
    await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
    console.log(`[PUSH] Admin ${req.user.email} unsubscribed from push notifications`);
    res.json({ message: 'Desktop notifications disabled' });
  } catch (error) {
    console.error('push unsubscribe error:', error);
    res.status(500).json({ error: 'Failed to disable desktop notifications' });
  }
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const sub = await PushSubscription.findOne({ userId: req.user._id });
    res.json({ subscribed: !!sub });
  } catch (error) {
    console.error('push status error:', error);
    res.status(500).json({ error: 'Failed to check subscription status' });
  }
};
