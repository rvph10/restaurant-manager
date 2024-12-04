import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import '../types/session';

export const enhanceSession = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.id) {
    req.session.id = uuidv4();
  }

  // Regenerate session ID periodically
  if (req.session.created) {
    const age = Date.now() - new Date(req.session.created).getTime();
    if (age > 6 * 60 * 60 * 1000) {
      // 6 hours
      req.session.regenerate((err) => {
        if (err) next(err);
        req.session.created = new Date();
        next();
      });
      return;
    }
  } else {
    req.session.created = new Date();
  }

  // Add CSRF token if not present
  if (!req.session.csrf) {
    req.session.csrf = uuidv4();
  }

  next();
};

export const validateCsrf = (req: Request, res: Response, next: NextFunction) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrf) {
      return res.status(403).json({ error: 'Invalid CSRF token' });
    }
  }
  next();
};
