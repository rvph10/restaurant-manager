import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma/client';
import { AppError } from './error.handler';

const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const validateSession = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = req.headers['x-session-id'] as string;
  const userId = req.user?.id;

  if (!sessionId || !userId) {
    return next();
  }

  const employee = await prisma.employee.findUnique({
    where: { id: userId },
  });

  if (!employee || employee.sessionId !== sessionId) {
    throw new AppError(401, 'Invalid or expired session');
  }

  if (employee.lastLogin) {
    const sessionAge = Date.now() - employee.lastLogin.getTime();
    if (sessionAge > SESSION_EXPIRY) {
      await prisma.employee.update({
        where: { id: userId },
        data: { sessionId: null },
      });
      throw new AppError(401, 'Session expired');
    }
  }
  next();
};
