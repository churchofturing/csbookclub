import { Request, Response } from 'express';
import { Prisma, Topic } from '@prisma/client';

import prisma from '../misc/db.js';
import { buildPageMetadata } from '../misc/buildPageMetadata.js';
import fivehundred from '../misc/500.js';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    topics: true;
    referralCodes: true;
    referredBy: true;
    threads: { include: { topic: true } };
    replies: { include: { thread: { include: { topic: true } } } };
  };
}>;

const transformUserPosts = (user: UserWithRelations) => {
  const topics = user.topics.map((topic: Topic) => ({
    type: 'Topic' as const,
    ...topic,
    link: `/${topic.slug}`,
  }));

  const threads = user.threads.map((thread) => ({
    type: 'Thread' as const,
    ...thread,
    link: `/${thread.topic.slug}/${thread.globalCount}/${thread.slug}`,
  }));

  const replies = user.replies.map((reply) => ({
    type: 'Reply' as const,
    ...reply,
    link: `/${reply.thread.topic.slug}/${reply.thread.globalCount}/${reply.thread.slug}#${reply.globalCount}`,
  }));

  return [...topics, ...threads, ...replies].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getUserPage = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username) return res.redirect('/404');
    if (username === 'Prog') return res.redirect('/404');

    const user = await prisma.user.findFirst({
      where: { username },
      include: {
        topics: true,
        referralCodes: true,
        referredBy: true,
        threads: {
          where: {
            NOT: {
              topic: {
                title: 'Prog',
              },
            },
          },
          include: { topic: true },
        },
        replies: {
          where: {
            NOT: {
              thread: {
                topic: {
                  title: 'Prog',
                },
              },
            },
          },
          include: { thread: { include: { topic: true } } },
        },
      },
    });

    if (!user) return res.redirect('/404');

    const posts = transformUserPosts(user);
    const metadata = {
      topicCount: user.topics.length,
      threadCount: user.threads.length,
      replyCount: user.replies.length,
    };

    const referralCodes = req.session?.user?.id === user.id ? user.referralCodes : [];
    const referLimit = req.session?.user?.username === 'admin' ? 20000 : process.env.REFER_LIMIT;

    return res.render('user', {
      user: req.session.user,
      pageUser: user,
      posts,
      metadata,
      startTime: req.startTime,
      page: buildPageMetadata(
        req,
        `${user.username} overview`,
        `Post history for ${user.username}`,
      ),
      referralCodes,
      referLimit,
      referredBy: user.referredBy?.username,
    });
  } catch {
    return fivehundred(req, res);
  }
};
