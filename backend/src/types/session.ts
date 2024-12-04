import 'express-session';

declare module 'express-session' {
  interface SessionData {
    id: string;
    created: Date;
    csrf: string;
  }
}
