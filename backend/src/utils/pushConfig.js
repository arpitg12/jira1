import 'dotenv/config';
import webpush from 'web-push';
import { env } from '../config/env.js';

const vapidPublicKey = env.vapidPublicKey;   
const vapidPrivateKey = env.vapidPrivateKey;
const vapidSubject = env.vapidSubject;       

const hasVapidKeys = Boolean(vapidPublicKey && vapidPrivateKey);

if (hasVapidKeys) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export const getVapidPublicKey = () => vapidPublicKey;
export const isPushConfigured = () => hasVapidKeys;

export default webpush;
