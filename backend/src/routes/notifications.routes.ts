import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'Get notifications - to be implemented' });
});

router.patch('/:id/read', (req, res) => {
  res.json({ message: 'Mark notification as read - to be implemented' });
});

export default router;
