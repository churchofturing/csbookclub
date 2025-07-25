import { Request, Response, NextFunction } from 'express';

import prisma from './db.js';

type CustomHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  errors: string[],
) => void | Promise<void>;

/*
  This is a middleware that checks if a user is banned via IP.
  Should be useful for people ban evading via multiple accounts.
*/
const ipBanFilter =
  (errorPage: CustomHandler) => async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();

    // Admin privelege.
    if (req.session.user) {
      // Right this way sir...
      if (req.session.user.role.split(',').includes('ADMIN')) return next();
    }

    const remoteAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;

    // Get all the bans issued to this IP.
    const bans = await prisma.ban.findMany({
      where: {
        ip: {
          equals: remoteAddress as string,
        },
      },
    });

    // Seperate them by expired and active.
    const expired = bans.filter((ban) => ban.expiresAt < now);
    const active = bans.filter((ban) => ban.expiresAt >= now);

    // If there are expired IP bans, just delete them.
    if (expired.length > 0) {
      const expiredToDelete = expired.map((ban) =>
        prisma.ban.delete({
          where: {
            id: ban.id,
          },
        }),
      );

      await Promise.all(expiredToDelete);
    }

    // If there are active IP bans, redirect them.
    if (active.length > 0) {
      const expiresAt = new Date(active[0].expiresAt);
      const differenceInMinutes = (expiresAt.getTime() - now.getTime()) / 1000 / 60;

      return errorPage(req, res, next, [
        `You are IP banned, check back in ${Math.ceil(differenceInMinutes)} minutes`,
      ]);
    }

    return next();
  };

export default ipBanFilter;
