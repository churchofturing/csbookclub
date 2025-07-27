import { Request, Response, NextFunction } from 'express';

import { createMarkdownRenderer } from '../misc/markdown.js';
import prisma from '../misc/db.js';
import { REPLY_BODY_REQUIRED, BODY_MAX_LENGTH } from '../misc/strings.js';
import fourohfour from '../misc/404.js';
import { generateToken } from '../misc/csrfFilter.js';
import { setLastPostTime } from '../misc/floodDetector.js';

const getThread = async (
  req: Request,
  res: Response,
  next: NextFunction,
  errors: string[] = [],
) => {
  const { slug, threadSlug } = req.params;
  const globalCount = parseInt(req.params.globalCount, 10);

  if (!slug) return fourohfour(req, res);
  if (!globalCount) return fourohfour(req, res);

  const topic = await prisma.topic.findFirst({
    where: {
      slug,
    },
  });

  if (!topic) return fourohfour(req, res);

  const thread = await prisma.thread.findFirst({
    where: {
      globalCount,
      topicId: topic.id,
      slug: threadSlug,
    },
    include: {
      createdBy: {
        select: {
          username: true,
          bannedAt: true,
          id: true,
        },
      },
      replies: {
        include: {
          createdBy: {
            select: {
              username: true,
              bannedAt: true,
              id: true,
            },
          },
        },
      },
      topic: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!thread) return fourohfour(req, res);

  const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  const rss = url[url.length - 1] === '/' ? `${url}.rss` : `${url}/.rss`;
  return res.render('single-thread', {
    thread,
    user: req.session.user,
    errors,
    startTime: req.startTime,
    csrfToken: generateToken(req),
    page: {
      title: `${thread.title} - CS Book Club`,
      desc: `${thread.body
        .replace(/(\r\n|\n|\r|>)/gm, ' ')
        .trim()
        .slice(0, 100)}...`,
      url,
      rss,
    },
  });
};

const createReply = async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;
  const { body } = req.body;
  const { user } = req.session;
  const globalCount = parseInt(req.params.globalCount, 10);

  // Early validation
  if (!globalCount) return fourohfour(req, res);
  if (!slug) return fourohfour(req, res);

  const validationErrors = [];
  if (!body) validationErrors.push(REPLY_BODY_REQUIRED);
  if (body && body.length > 5000) validationErrors.push(BODY_MAX_LENGTH);

  if (validationErrors.length > 0) {
    return getThread(req, res, next, validationErrors);
  }

  try {
    const thread = await prisma.thread.findFirst({
      where: {
        globalCount,
        topic: {
          slug, // This uses the relation, more efficient than separate queries
        },
      },
      select: {
        id: true,
        replyCount: true,
        slug: true,
        topicId: true,
        globalCount: true,
        topic: {
          select: {
            id: true,
            slug: true,
            topicCount: true,
          },
        },
        // Remove the expensive replies include - we don't need it for creating a reply
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!thread) return fourohfour(req, res);

    const userId = user?.id || null;
    let tempUser;

    if (userId) {
      tempUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, lastPostedAt: true },
      });
    }

    if (!tempUser) {
      tempUser = await prisma.user.findFirst({
        where: { username: 'Anonymous' },
        select: { id: true, lastPostedAt: true },
      });
    }

    // If the user isn't logged in, OR anonymous, something has went very wrong.
    if (!tempUser) throw new Error('No user found');

    const md = createMarkdownRenderer(slug, thread.slug, thread.globalCount);
    const bodyHtml = md.render(body);

    const newReply = await prisma.$transaction(async (tx) => {
      // Use atomic increment for replyCount
      const updatedThread = await tx.thread.update({
        where: { id: thread.id },
        data: {
          lastBumped: new Date(),
          replyCount: { increment: 1 },
        },
        select: { replyCount: true },
      });

      const tempReply = await tx.reply.create({
        data: {
          body,
          bodyHtml,
          createdById: tempUser.id,
          threadId: thread.id,
          globalCount: updatedThread.replyCount,
          ip: req.ip as string,
        },
        select: {
          id: true,
          globalCount: true,
        },
      });

      // Update user's last posted time
      await tx.user.update({
        where: { id: tempUser.id },
        data: { lastPostedAt: new Date() },
      });

      return tempReply;
    });

    setLastPostTime(req);
    res.redirect(`${req.originalUrl}/${thread.slug}#${newReply.globalCount}`);
    return;
  } catch {
    res.status(500).render('500');
  }
};

const getThreadRedirect = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const globalCount = parseInt(req.params.globalCount, 10);

  try {
    const thread = await prisma.thread.findFirst({
      where: {
        globalCount,
        topic: {
          slug,
        },
      },
      select: {
        slug: true,
      },
    });

    if (!thread) return res.redirect('/404');

    const hashIndex = req.originalUrl.indexOf('#');
    const hash = hashIndex !== -1 ? req.originalUrl.substring(hashIndex) : '';

    const redirectUrl = `/${slug}/${globalCount}/${thread.slug}${hash}`;
    return res.redirect(redirectUrl);
  } catch {
    return res.redirect('/500');
  }
};

export { getThread, createReply, getThreadRedirect };
