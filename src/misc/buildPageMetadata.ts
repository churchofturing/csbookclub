import { Request } from 'express';

export const buildPageMetadata = (req: Request, title: string, desc?: string) => ({
  title,
  desc,
  url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
});
