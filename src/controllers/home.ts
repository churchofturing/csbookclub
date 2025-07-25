import { Request, Response } from 'express';
import { getRandomFile } from '../misc/banner.js';

import prisma from '../misc/db.js';
import { buildPageMetadata } from '../misc/buildPageMetadata.js';
import fivehundred from '../misc/500.js';

const buildRssUrl = (req: Request) => {
  const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  return url[url.length - 1] === '/' ? `${url}.rss` : `${url}/.rss`;
};

export const getIndexPage = async (req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      include: {
        createdBy: {
          select: { id: true, username: true, bannedAt: true },
        },
        _count: { select: { threads: true } },
      },
      orderBy: [{ pinned: 'desc' }, { lastBumped: 'desc' }],
    });

    const randomBanner = getRandomFile();
    return res.render('index', {
      topics,
      user: req.session.user,
      startTime: req.startTime,
      bannerImage: randomBanner,
      page: {
        ...buildPageMetadata(
          req,
          'Index - Computer Science Book Club',
          'A BBS textboard for discussing the classics of computer science.',
        ),
        rss: buildRssUrl(req),
      },
    });
  } catch {
    return fivehundred(req, res);
  }
};
