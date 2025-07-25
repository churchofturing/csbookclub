import { Request, Response, NextFunction } from 'express';
import { createMarkdownRenderer } from '../misc/markdown.js';
import prisma from '../misc/db.js';

import {
  THREAD_BODY_REQUIRED,
  THREAD_TITLE_REQUIRED,
  BODY_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  SLUG_REQUIRED,
  SLUG_MAX_LENGTH,
  SLUG_ALREADY_EXISTS,
} from '../misc/strings.js';

import fourohfour from '../misc/404.js';

import { generateToken } from '../misc/csrfFilter.js';
import stringToSlug from '../misc/slugGenerator.js';
import { setLastPostTime } from '../misc/floodDetector.js';
import fivehundred from '../misc/500.js';

// Get a channel by its ID.
const getTopic = async (req: Request, res: Response, next: NextFunction, errors: string[] = []) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  // If they don't supply a slug then 404.
  if (!slug) return fourohfour(req, res);

  // Get topic first
  const topic = await prisma.topic.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      body: true,
      bodyHtml: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      lastBumped: true,
      topicCount: true,
      pinned: true,
      ip: true,
      createdBy: {
        select: {
          username: true,
          bannedAt: true,
          id: true,
        },
      },
    },
  });

  // If a topic with the supplied ID doesn't exist then 404.
  if (!topic) return fourohfour(req, res);

  // Use optimized Prisma queries instead of raw SQL for SQLite compatibility
  const [threadsWithCounts, totalThreads] = await Promise.all([
    // Get threads with reply counts in single query
    prisma.thread.findMany({
      where: {
        topicId: topic.id,
      },
      select: {
        id: true,
        topicId: true,
        title: true,
        body: true,
        bodyHtml: true,
        createdAt: true,
        lastBumped: true,
        pinned: true,
        ip: true,
        globalCount: true,
        replyCount: true,
        slug: true,
        createdBy: {
          select: {
            username: true,
            bannedAt: true,
            id: true,
          },
        },
        _count: {
          select: {
            replies: true,
          },
        },
      },
      orderBy: [
        {
          pinned: 'desc',
        },
        {
          lastBumped: 'desc',
        },
      ],
      skip: skip,
      take: limit,
    }),

    // Fast count query
    prisma.thread.count({
      where: {
        topicId: topic.id,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalThreads / limit);

  // Get replies for the threads in a batch
  const threadIds = threadsWithCounts.map((t) => t.id);

  const allReplies =
    threadIds.length > 0
      ? await prisma.reply.findMany({
          where: {
            threadId: { in: threadIds },
          },
          select: {
            id: true,
            threadId: true,
            ip: true,
            progName: true,
            bodyHtml: true,
            body: true,
            createdAt: true,
            globalCount: true,
            createdBy: {
              select: {
                username: true,
                bannedAt: true,
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      : [];

  // Group replies by thread (take only 3 most recent per thread)
  const repliesByThread = new Map();
  allReplies.forEach((reply) => {
    if (!repliesByThread.has(reply.threadId)) {
      repliesByThread.set(reply.threadId, []);
    }
    const threadReplies = repliesByThread.get(reply.threadId);
    if (threadReplies.length < 3) {
      threadReplies.push(reply);
    }
  });

  // Transform to expected format
  const threads = threadsWithCounts.map((thread) => ({
    id: thread.id,
    topicId: thread.topicId,
    title: thread.title,
    body: thread.body,
    bodyHtml: thread.bodyHtml,
    createdAt: thread.createdAt,
    lastBumped: thread.lastBumped,
    pinned: thread.pinned,
    ip: thread.ip,
    globalCount: thread.globalCount,
    replyCount: thread.replyCount,
    totalReplies: thread._count.replies,
    createdBy: thread.createdBy,
    slug: thread.slug,
    replies: (repliesByThread.get(thread.id) || []).slice(0, 4).reverse(),
  }));

  // Attach threads to topic object to maintain your existing template structure
  const topicWithThreads = {
    ...topic,
    threads: threads,
  };

  const url = `${req.protocol}://${req.hostname}${req.originalUrl}`;
  const rss = url[url.length - 1] === '/' ? `${url}.rss` : `${url}/.rss`;

  return res.render('single-topic', {
    topic: topicWithThreads,
    user: req.session.user,
    errors,
    startTime: req.startTime,
    csrfToken: generateToken(req),
    page: {
      title: `${topic.title} - Computer Science Book Club`,
      desc: `${topic.body
        .trim()
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .slice(0, 50)}...`,
      url,
      rss,
    },
    pagination: {
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

const createThread = async (req: Request, res: Response, next: NextFunction) => {
  const { title, body } = req.body;
  const { user } = req.session;
  const { slug } = req.params;

  // If they don't supply a slug then 404
  if (!slug) return fourohfour(req, res);

  const validationErrors = [];
  if (!body) validationErrors.push(THREAD_BODY_REQUIRED);
  if (!title) validationErrors.push(THREAD_TITLE_REQUIRED);

  if (validationErrors.length > 0) {
    return getTopic(req, res, next, validationErrors);
  }

  if (title.length > 200) validationErrors.push(TITLE_MAX_LENGTH);
  if (body.length > 5000) validationErrors.push(BODY_MAX_LENGTH);

  if (validationErrors.length > 0) {
    return getTopic(req, res, next, validationErrors);
  }

  const topic = await prisma.topic.findFirst({
    where: {
      slug,
    },
  });

  const tempUser = user
    ? user
    : await prisma.user.findFirst({
        where: {
          username: 'Anonymous',
        },
      });

  // "Burn down, down, burn down Not Topic" - Southpark
  if (!topic) return fourohfour(req, res);

  const md = createMarkdownRenderer(slug);

  try {
    const newThread = await prisma.$transaction(async (tx) => {
      const { topicCount } = topic;

      const tempThread = await tx.thread.create({
        data: {
          title,
          body,
          bodyHtml: md.render(body),
          createdBy: {
            connect: {
              id: tempUser?.id,
            },
          },
          topic: {
            connect: {
              id: topic.id,
            },
          },
          globalCount: topicCount + 1,
          ip: req.ip as string,
          slug: stringToSlug(title),
        },
      });

      await tx.topic.update({
        where: {
          id: topic.id,
        },
        data: {
          topicCount: topicCount + 1,
          lastBumped: new Date(),
        },
      });

      await tx.user.update({
        where: {
          id: tempUser?.id,
        },
        data: {
          lastPostedAt: new Date(),
        },
      });

      if (slug === 'prog') {
        await tx.reply.create({
          data: {
            body,
            bodyHtml: md.render(body),
            createdBy: {
              connect: {
                id: tempUser?.id,
              },
            },
            thread: {
              connect: {
                id: tempThread.id,
              },
            },
            globalCount: 1,
            ip: req.ip as string,
          },
        });

        await tx.thread.update({
          where: {
            id: tempThread.id,
          },
          data: {
            lastBumped: new Date(),
            replyCount: 1,
          },
        });

        // update the user's last posted time
        await tx.user.update({
          where: {
            id: tempUser?.id,
          },
          data: {
            lastPostedAt: new Date(),
          },
        });
      }

      return tempThread;
    });

    setLastPostTime(req);
    res.redirect(`/${topic.slug}/${newThread.globalCount}/${newThread.slug}`);
    return;
  } catch {
    return fivehundred(req, res);
  }
};

const createTopic = async (req: Request, res: Response, next: NextFunction) => {
  const { title, body, slug } = req.body;
  const { user } = req.session;

  const validationErrors = [];
  if (!slug) validationErrors.push(SLUG_REQUIRED);
  if (!body) validationErrors.push(THREAD_BODY_REQUIRED);
  if (!title) validationErrors.push(THREAD_TITLE_REQUIRED);

  if (validationErrors.length > 0) {
    return getTopic(req, res, next, validationErrors);
  }

  if (slug.length > 10) validationErrors.push(SLUG_MAX_LENGTH);
  if (title.length > 200) validationErrors.push(TITLE_MAX_LENGTH);
  if (body.length > 5000) validationErrors.push(BODY_MAX_LENGTH);

  if (validationErrors.length > 0) {
    return getTopic(req, res, next, validationErrors);
  }

  const topic = await prisma.topic.findFirst({
    where: {
      slug,
    },
  });

  // A topic with this slug already exists...
  if (topic) return getTopic(req, res, next, [SLUG_ALREADY_EXISTS]);

  const md = createMarkdownRenderer(slug);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.topic.create({
        data: {
          title,
          body,
          bodyHtml: md.render(body),
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
          ip: req.ip as string,
          slug,
        },
      });
    });

    return res.redirect(`/${slug}`);
  } catch {
    return fivehundred(req, res);
  }
};

export { getTopic, createThread, createTopic };
