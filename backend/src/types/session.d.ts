import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    roles?: string[];
    lastAccess?: Date;
  }

  interface Session {
    user: {
      id: string;
      roles: string[];
    };
  }

  export interface Request {
    user?: {
      id: string;
      roles: string[];
    };
  }
}
