import { Request, Response, NextFunction } from 'express';

import prisma from './db.js';

type CustomHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  errors: string[],
) => void | Promise<void>;

/*
  This is a middleware that checks if a user is banned
  and if they are, prevents them from making the request.

  I wouldn't typically like a DB query in a middleware, but
  because this happens only on replies and relatively infrequently 
  I think it's fine.
*/
const bannedAccountFilter =
  (errorPage: CustomHandler) => async (req: Request, res: Response, next: NextFunction) => {
    if (req.session.user) {
      const user = await prisma.user.findFirst({
        where: {
          id: req.session.user.id,
        },
      });

      // You didn't see anything...
      if (user?.role.split(',').includes('ADMIN')) return next();

      // If there's a ban on the account.
      if (user?.bannedAt) {
        const now = new Date();

        const bannedAt = new Date(user.bannedAt);
        const differenceInMinutes = (bannedAt.getTime() - now.getTime()) / 1000 / 60;

        // Check if the ban is active (still needs to expire)
        if (differenceInMinutes > 0) {
          return errorPage(req, res, next, [
            `You are banned, check back in ${Math.ceil(differenceInMinutes)} minutes`,
          ]);
        }

        // The ban has expired, clear it from the DB.
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            bannedAt: null,
          },
        });
      }

      return next();
    }

    return next();
  };

export default bannedAccountFilter;
