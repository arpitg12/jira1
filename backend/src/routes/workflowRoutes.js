import express from 'express';
import * as workflowController from '../controllers/workflowController.js';

const router = express.Router();

router.post('/', workflowController.createWorkflow);
router.get('/', workflowController.getWorkflows);
router.get('/:id', workflowController.getWorkflowById);
router.put('/:id', workflowController.updateWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

// States management
router.post('/:id/states', workflowController.addStateToWorkflow);
router.delete('/:id/states', workflowController.removeStateFromWorkflow);

export default router;
