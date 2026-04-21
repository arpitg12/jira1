import express from 'express';
import * as issueController from '../controllers/issueController.js';

const router = express.Router();

router.post('/', issueController.createIssue);
router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.put('/:id', issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

// Comments
router.post('/:id/comments', issueController.addComment);

export default router;
