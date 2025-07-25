import { Request, Response } from 'express';

export default async (req: Request, res: Response) =>
  res.status(404).render('404', {
    user: req.session.user,
    startTime: req.startTime,
    page: {
      title: 'Page not found',
      url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
    },
  });
