import { Request, Response } from 'express';

import fourohfour from '../misc/404.js';
import prisma from '../misc/db.js';
import { Reply, Thread, Topic } from '@prisma/client';

const getAllTopicsRss = async (req: Request, res: Response) => {
  const topics = await prisma.topic.findMany({
    where: {
      // 14 is /prog/.
      id: { not: 14 },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          username: true,
          bannedAt: true,
        },
      },
      _count: {
        select: { threads: true },
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
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>Computer Science Book Club</title>
      <link>https://csbook.club</link>
      <description>A book club dedicated solely to computer science.</description>
      <image>
        <url>https://csbook.club/public/apple-touch-icon.png</url>
        <title>Lambda</title>
        <link>https://csbook.club/</link>
      </image>
      <managingEditor>churchofturing@gmail.com</managingEditor>
      <webMaster>churchofturing@gmail.com</webMaster>
      ${topics
        .map(
          (topic: Topic) => `
      <item>
        <title>${topic.title}</title>
        <link>https://csbook.club/${topic.slug}</link>
        <description><![CDATA[${topic.bodyHtml}]]></description>
        <pubDate>${topic.createdAt.toUTCString()}</pubDate>
      </item>`,
        )
        .join('')}
    </channel>
  </rss>`;

  res.set('Content-Type', 'text/xml');

  return res.status(200).send(xml);
};

const getSingleTopicRss = async (req: Request, res: Response) => {
  const { slug } = req.params;

  // If they don't supply a slug then 404.
  if (!slug) return fourohfour(req, res);

  const topic = await prisma.topic.findFirst({
    where: {
      slug,
      // 14 is /prog/.
      id: { not: 14 },
    },
    include: {
      createdBy: {
        select: {
          username: true,
          bannedAt: true,
          id: true,
        },
      },
      threads: {
        include: {
          createdBy: {
            select: {
              username: true,
              bannedAt: true,
              id: true,
            },
          },
          replies: {
            orderBy: {
              createdAt: 'desc',
            },
            select: {
              id: true,
              ip: true,
              createdBy: {
                select: {
                  username: true,
                  bannedAt: true,
                  id: true,
                },
              },
              bodyHtml: true,
              createdAt: true,
              globalCount: true,
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
      },
    },
  });

  if (!topic) return fourohfour(req, res);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${topic.title}</title>
      <link>https://csbook.club/${topic.slug}</link>
      <description><![CDATA[${topic.bodyHtml}]]></description>
      <image>
        <url>https://csbook.club/public/apple-touch-icon.png</url>
        <title>Lambda</title>
        <link>https://csbook.club/</link>
      </image>
      <managingEditor>churchofturing@gmail.com</managingEditor>
      <webMaster>churchofturing@gmail.com</webMaster>
      ${topic.threads
        .map(
          (thread: Thread) => `
      <item>
        <title>${thread.title}</title>
        <link>https://csbook.club/${topic.slug}/${thread.globalCount}/${thread.slug}</link>
        <description><![CDATA[${thread.bodyHtml}]]></description>
        <pubDate>${thread.createdAt.toUTCString()}</pubDate>
      </item>`,
        )
        .join('')}
    </channel>
  </rss>`;

  res.set('Content-Type', 'text/xml');

  return res.status(200).send(xml);
};

const getSingleThreadRss = async (req: Request, res: Response) => {
  const { slug, threadSlug } = req.params;
  const globalCount = parseInt(req.params.globalCount, 10);

  if (!slug) return fourohfour(req, res);
  if (!globalCount) return fourohfour(req, res);

  const topic = await prisma.topic.findFirst({
    where: {
      slug,
      id: { not: 14 },
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${thread.title}</title>
      <link>https://csbook.club/${thread.topic.slug}/${thread.globalCount}/${thread.slug}</link>
      <description><![CDATA[${thread.bodyHtml}]]></description>
      <image>
        <url>https://csbook.club/public/apple-touch-icon.png</url>
        <title>Lambda</title>
        <link>https://csbook.club/</link>
      </image>
      <managingEditor>churchofturing@gmail.com</managingEditor>
      <webMaster>churchofturing@gmail.com</webMaster>
      ${thread.replies
        .map(
          (reply: Reply) => `
      <item>
        <title>Reply to: ${thread.title}</title>
        <link>https://csbook.club/${thread.topic.slug}/${thread.globalCount}#${reply.globalCount}</link>
        <description><![CDATA[${reply.bodyHtml}]]></description>
        <pubDate>${reply.createdAt.toUTCString()}</pubDate>
      </item>`,
        )
        .join('')}
    </channel>
  </rss>`;

  res.set('Content-Type', 'text/xml');

  return res.status(200).send(xml);
};

export { getAllTopicsRss, getSingleTopicRss, getSingleThreadRss };
