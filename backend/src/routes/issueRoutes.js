import express from 'express';
import * as issueController from '../controllers/issueController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/', issueController.createIssue);
router.get('/', issueController.getIssues);
router.get('/:id', issueController.getIssueById);
router.put('/:id', issueController.updateIssue);
router.delete('/:id', issueController.deleteIssue);

// Comments
router.post('/:id/comments', issueController.addComment);
router.put('/:id/comments/:commentId', issueController.updateComment);
router.delete('/:id/comments/:commentId', issueController.deleteComment);
router.post('/:id/comments/:commentId/replies', issueController.addReply);
router.put('/:id/comments/:commentId/replies/:replyId', issueController.updateReply);
router.delete('/:id/comments/:commentId/replies/:replyId', issueController.deleteReply);

export default router;
