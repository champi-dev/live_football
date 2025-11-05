import { Router } from 'express';
import { TeamsController } from '../controllers/teams.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/search', TeamsController.searchTeams);
router.post('/:id/follow', authenticate, TeamsController.followTeam);
router.delete('/:id/follow', authenticate, TeamsController.unfollowTeam);

export default router;
