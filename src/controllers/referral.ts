import { Request, Response } from 'express';
import prisma from '../misc/db.js';
import referralGenerator from '../misc/referralGenerator.js';
import fivehundred from '../misc/500.js';

export const createReferral = async (req: Request, res: Response) => {
  try {
    const { user } = req.session;

    const existingUser = await prisma.user.findFirst({
      where: { id: user?.id },
      include: { referralCodes: true },
    });

    const limit = Number(process.env.REFER_LIMIT) || 8;
    const referralsLength = existingUser?.referralCodes ? existingUser?.referralCodes.length : 0;

    if (referralsLength >= limit && user?.username !== 'admin') {
      return res.redirect(`/user/${user?.username}`);
    }

    const code = referralGenerator();
    await prisma.referralCode.create({
      data: {
        code,
        user: { connect: { id: user?.id } },
      },
    });

    return res.redirect(`/user/${user?.username}`);
  } catch {
    return fivehundred(req, res);
  }
};
