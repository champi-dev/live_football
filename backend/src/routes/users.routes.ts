import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/me/following', authenticate, UsersController.getFollowedTeams);

export default router;
