import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getPublicKey, subscribeToPush } from '../controllers/pushController.js';

const router = express.Router();

router.use(authenticate);
router.get('/vapid-public-key', getPublicKey);
router.post('/subscribe', subscribeToPush);

export default router;
