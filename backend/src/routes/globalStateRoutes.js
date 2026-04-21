import express from 'express';
import * as globalStateController from '../controllers/globalStateController.js';

const router = express.Router();

router.post('/', globalStateController.createGlobalState);
router.get('/', globalStateController.getGlobalStates);
router.get('/:id', globalStateController.getGlobalStateById);
router.put('/:id', globalStateController.updateGlobalState);
router.delete('/:id', globalStateController.deleteGlobalState);

export default router;
