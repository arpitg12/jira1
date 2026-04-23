import express from 'express';
import * as workflowController from '../controllers/workflowController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.get('/', requireAdmin, workflowController.getWorkflows);
router.get('/:id', requireAdmin, workflowController.getWorkflowById);
router.post('/', requireAdmin, workflowController.createWorkflow);
router.put('/:id', requireAdmin, workflowController.updateWorkflow);
router.delete('/:id', requireAdmin, workflowController.deleteWorkflow);

// States management
router.post('/:id/states', requireAdmin, workflowController.addStateToWorkflow);
router.delete('/:id/states', requireAdmin, workflowController.removeStateFromWorkflow);

export default router;
