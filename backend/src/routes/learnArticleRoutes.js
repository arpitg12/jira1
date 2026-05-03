import express from 'express';
import * as learnArticleController from '../controllers/learnArticleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);
router.post('/', learnArticleController.createArticle);
router.get('/', learnArticleController.getArticles);
router.get('/:id', learnArticleController.getArticleById);
router.put('/:id', learnArticleController.updateArticle);
router.delete('/:id', learnArticleController.deleteArticle);

export default router;
