import 'dotenv/config';
import webpush from 'web-push';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@jira.local';

const hasVapidKeys = Boolean(vapidPublicKey && vapidPrivateKey);

if (hasVapidKeys) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export const getVapidPublicKey = () => vapidPublicKey;
export const isPushConfigured = () => hasVapidKeys;

export default webpush;
