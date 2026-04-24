import User from '../models/User.js';
import { getVapidPublicKey } from '../utils/pushConfig.js';

const normalizeSubscription = (subscription = {}) => ({
  endpoint: subscription.endpoint,
  expirationTime:
    subscription.expirationTime === null || subscription.expirationTime === undefined
      ? null
      : Number(subscription.expirationTime),
  keys: {
    p256dh: subscription?.keys?.p256dh,
    auth: subscription?.keys?.auth,
  },
});

const isSameSubscription = (left, right) =>
  left?.endpoint === right?.endpoint &&
  left?.keys?.p256dh === right?.keys?.p256dh &&
  left?.keys?.auth === right?.keys?.auth;

export const getPublicKey = async (req, res) => {
  res.json({ publicKey: getVapidPublicKey() });
};

export const subscribeToPush = async (req, res) => {
  try {
    const { userId, subscription } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'A valid push subscription is required' });
    }

    if (userId && String(userId) !== String(req.user._id)) {
      return res.status(403).json({ error: 'You can only register subscriptions for your own account' });
    }

    const normalizedSubscription = normalizeSubscription(subscription);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const nextSubscriptions = Array.isArray(user.pushSubscriptions) ? [...user.pushSubscriptions] : [];
    const existingIndex = nextSubscriptions.findIndex((entry) =>
      isSameSubscription(entry, normalizedSubscription)
    );

    if (existingIndex >= 0) {
      nextSubscriptions[existingIndex] = normalizedSubscription;
    } else {
      nextSubscriptions.push(normalizedSubscription);
    }

    user.pushSubscriptions = nextSubscriptions;
    await user.save();

    res.json({
      message: 'Push subscription saved successfully',
      subscriptionsCount: user.pushSubscriptions.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
