import { Router } from 'express';
import { MatchesController } from '../controllers/matches.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get matches with filters and pagination
router.get('/', MatchesController.getMatches);

// Legacy endpoint for live matches
router.get('/live', MatchesController.getLiveMatches);

// Sync endpoints
router.post('/sync', MatchesController.syncTodayMatches); // Sync today's matches
router.post('/sync/range', MatchesController.syncMatchesByDateRange); // Sync date range

// Match details and insights
router.get('/:id', MatchesController.getMatchById);
router.get('/:id/insights', MatchesController.getMatchInsights);
router.post('/:id/insights', authenticate, MatchesController.generateInsights);

export default router;
