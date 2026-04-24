import express from 'express';
import * as userController from '../controllers/userController.js';
import {
  authenticate,
  optionalAuthenticate,
  requireAdmin,
} from '../middleware/auth.js';

const router = express.Router();

router.post('/login', userController.loginUser);
router.get('/me', authenticate, userController.getCurrentUser);
router.post('/', optionalAuthenticate, userController.createUser);
router.get('/', authenticate, userController.getUsers);
router.put('/password', authenticate, requireAdmin, userController.updateUserPasswordByEmail);
router.get('/:id', authenticate, userController.getUserById);
router.put('/:id', authenticate, requireAdmin, userController.updateUser);
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

export default router;
