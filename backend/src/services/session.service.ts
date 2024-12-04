import { redisClient } from '../config/session';
import { logger } from '../lib/logging/logger';

export class SessionService {
  private static CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour

  static startCleanup() {
    setInterval(async () => {
      try {
        const keys = await redisClient.keys('sess:*');
        let cleaned = 0;

        for (const key of keys) {
          const session = await redisClient.get(key);
          if (session) {
            const sessionData = JSON.parse(session);
            if (this.isExpired(sessionData)) {
              await redisClient.del(key);
              cleaned++;
            }
          }
        }

        if (cleaned > 0) {
          logger.info(`Cleaned ${cleaned} expired sessions`);
        }
      } catch (error) {
        logger.error('Session cleanup error:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  private static isExpired(session: any): boolean {
    if (!session.cookie || !session.cookie.expires) return true;
    return new Date(session.cookie.expires) < new Date();
  }
}