import express from 'express';
import * as globalStateController from '../controllers/globalStateController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', requireAdmin, globalStateController.getGlobalStates);
router.get('/:id', requireAdmin, globalStateController.getGlobalStateById);
router.post('/', requireAdmin, globalStateController.createGlobalState);
router.put('/:id', requireAdmin, globalStateController.updateGlobalState);
router.delete('/:id', requireAdmin, globalStateController.deleteGlobalState);

export default router;
