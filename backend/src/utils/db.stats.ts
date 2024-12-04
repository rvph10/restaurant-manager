import { prisma } from '../prisma/client';
import { logger } from '../lib/logging/logger';

export async function getDatabaseStats() {
  try {
    const stats: {
      database_size: string;
      tables_size: string;
      active_connections: BigInt;
      total_tables: BigInt;
      total_rows: BigInt;
    }[] = await prisma.$queryRaw`
            SELECT
                pg_size_pretty(pg_database_size(current_database())) as database_size,
                pg_size_pretty(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename)))) as tables_size,
                (SELECT count(*) FROM pg_stat_activity) as active_connections,
                (
                    SELECT COUNT(*) 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                ) as total_tables,
                (
                    SELECT SUM(n_live_tup) 
                    FROM pg_stat_user_tables
                ) as total_rows
            FROM pg_tables
            WHERE schemaname = 'public';
        `;

    return {
      database_size: stats[0].database_size,
      tables_size: stats[0].tables_size,
      active_connections: Number(stats[0].active_connections),
      total_tables: Number(stats[0].total_tables),
      total_rows: Number(stats[0].total_rows || 0),
    };
  } catch (error) {
    logger.error('Error getting database stats:', error);
    throw error;
  }
}
