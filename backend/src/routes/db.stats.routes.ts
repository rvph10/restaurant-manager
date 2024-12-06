import { Router } from 'express';
import { getDatabaseStats } from '../utils/db.stats';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { logger } from '../lib/logging/logger';
import { redisManager } from '../lib/redis/redis.manager';
import { CACHE_DURATIONS, CACHE_KEYS } from '../constants/cache';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const cachedStats = await redisManager.get(CACHE_KEYS.DB_STATS);
    if (cachedStats) {
      res.json({
        status: 'success',
        data: cachedStats,
        fromCache: true,
      });
      return;
    }

    const stats = await getDatabaseStats();
    await redisManager.set(CACHE_KEYS.DB_STATS, stats, CACHE_DURATIONS.DB_STATS);

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
