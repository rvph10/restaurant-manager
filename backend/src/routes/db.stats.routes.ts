import { Router } from 'express';
import { getDatabaseStats } from '../utils/db.stats';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logger } from '../lib/logging/logger';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching database stats:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch database statistics',
    });
  }
});

export { router as dbStatsRouter };
