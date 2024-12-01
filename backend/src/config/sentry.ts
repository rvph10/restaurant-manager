import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { config } from './index';

export const configureSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: config.env,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: config.env === 'production' ? 0.1 : 1.0,
      profilesSampleRate: 1.0,
    });
  }
};
