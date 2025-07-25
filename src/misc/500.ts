import { Request, Response } from 'express';

export default async (req: Request, res: Response) =>
  res.status(500).render('500', {
    user: req.session.user,
    startTime: req.startTime,
    page: {
      title: 'Server broke',
      url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
    },
  });
