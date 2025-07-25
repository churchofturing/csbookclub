import { Request, Response, NextFunction } from 'express';
import prisma from '../misc/db.js';
import referralGenerator from '../misc/referralGenerator.js';
import { createMarkdownRenderer } from '../misc/markdown.js';

/*
  This takes a generic post and cascadingly deletes it (deletes all children too.)
  For topics this means all threads and replies too, for threads this just means all replies etc.
  Takes three parameters.
   - id (int): The type of post we're deleting (topic, thread or reply).
   - type (string): Enum of "TOPIC" | "THREAD" | "REPLY", use this to find the item we're deleting.
   - reason (string): reason.

   So, for instance, a call such as /api/admin/2?reason=stupid&type=THREAD will delete
   the thread with the ID 2, along with all replies to the thread.
*/
const deleteGeneric = async (req: Request, res: Response) => {
  const { reason, type } = req.query;
  const { user } = req.session;
  const postId = parseInt(req.params.postId, 10);

  // TODO: Come back and fix this, <any> is a temporary hack migrating to TS.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeToPost: Record<string, any> = {
    TOPIC: prisma.topic,
    THREAD: prisma.thread,
    REPLY: prisma.reply,
  };

  // If the passed topic ID isn't a number then 404.
  if (!postId) {
    return res.status(404).json({ success: false, message: 'Post ID must be a valid number.' });
  }

  const postType = typeToPost[type as string];
  if (!type) {
    return res
      .status(400)
      .json({ success: false, message: `Type ${type} is not a valid post type.` });
  }

  const post = await postType.findFirst({
    where: {
      id: postId,
    },
    include: {
      createdBy: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

  try {
    // These need to be in an 'all or nothing' transaction.
    // If one fails, so should the other.
    await prisma.$transaction([
      prisma.modAudit.create({
        data: {
          title: post.title,
          body: post.body,
          reason: reason as string,
          postedBy: post.createdBy.username,
          action: `DELETE ${type}`,
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
        },
      }),
      postType.deleteMany({
        where: {
          id: post.id,
        },
      }),
    ]);

    return res.status(200).json({ success: true, message: 'Post deleted.' });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  }
};

const banUser = async (req: Request, res: Response) => {
  const { reason, days } = req.query;
  const { user } = req.session;
  const userId = parseInt(req.params.userId, 10);
  const daysNo = parseInt(days as string, 10);

  if (!userId) {
    return res.status(404).json({ success: false, message: 'userId needs to be an integer.' });
  }

  const userToDelete = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      topics: true,
      threads: true,
      replies: true,
    },
  });

  if (!userToDelete) return res.status(404).json({ success: false, message: 'User not found.' });

  try {
    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + daysNo);

    // Merge all of a user's posts, get their ips, remove duplicates.
    const allIps = new Set(
      [...userToDelete.topics, ...userToDelete.threads, ...userToDelete.replies].map(
        (elem) => elem.ip,
      ),
    );

    const dataToInsert = [...allIps].map((ip) => ({
      ip,
      expiresAt: bannedUntil,
      userId: userToDelete.id,
    }));

    await prisma.$transaction(async (tx) => {
      await tx.modAudit.create({
        data: {
          reason: reason as string,
          body: userToDelete.username,
          action: 'BAN USER',
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
        },
      });

      await tx.ban.deleteMany({
        where: {
          userId: userToDelete.id,
        },
      });

      await tx.user.update({
        where: {
          id: userToDelete.id,
        },
        // TODO: This probably gets fucked with timezones.
        // I'm sick of date programming, I'll make this more robust eventually.
        data: {
          bannedAt: bannedUntil,
        },
      });

      const promiseMap = dataToInsert.map((data) => tx.ban.create({ data }));
      await Promise.all(promiseMap);
    });

    return res.status(200).json({
      success: true,
      message: 'User has been banned.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  }
};

const unbanUser = async (req: Request, res: Response) => {
  const { reason } = req.query;
  const { user } = req.session;
  const userId = parseInt(req.params.userId, 10);

  if (!userId)
    return res.status(404).json({ success: false, message: 'userId needs to be an integer.' });

  const userToUnban = await prisma.user.findFirst({
    where: {
      id: userId,
    },
  });

  if (!userToUnban) return res.status(404).json({ success: false, message: 'User not found.' });

  try {
    await prisma.$transaction([
      prisma.modAudit.create({
        data: {
          reason: reason as string,
          body: userToUnban.username,
          action: 'UNBAN USER',
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
        },
      }),
      prisma.user.update({
        where: {
          id: userToUnban.id,
        },
        // TODO: This probably gets fucked with timezones.
        // I'm sick of date programming, I'll make this more robust eventually.
        data: {
          bannedAt: null,
        },
      }),
      prisma.ban.deleteMany({
        where: {
          userId: userToUnban.id,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'User has been unbanned.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  }
};

const getAdminPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
  errors: string[] = [],
) => {
  const modAudits = await prisma.modAudit.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      createdBy: {
        select: {
          username: true,
        },
      },
    },
  });

  const bans = await prisma.ban.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: {
        select: {
          username: true,
          id: true,
        },
      },
    },
  });

  const rows = modAudits.map((audit) => {
    const { createdAt, action, reason, body } = audit;
    return {
      createdBy: audit.createdBy.username,
      createdAt,
      action,
      reason,
      body,
    };
  });

  return res.render('admin', {
    user: req.session.user,
    auditEntries: rows,
    bans,
    errors,
    page: {
      title: 'Admin overview',
      url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
    },
  });
};

const pinOrUnpinPost = async (req: Request, res: Response) => {
  const { action, type } = req.query;
  const { user } = req.session;
  const postId = parseInt(req.params.postId, 10);

  if (!postId) {
    return res.status(404).json({ success: false, message: 'postId needs to be an integer.' });
  }

  if (action !== 'PIN' && action !== 'UNPIN') {
    return res.status(400).json({
      success: false,
      message: 'Action is either to PIN or UNPIN.',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeToPost: Record<string, any> = {
    TOPIC: prisma.topic,
    THREAD: prisma.thread,
  };

  const postType = typeToPost[type as string];

  if (!postType) {
    return res.status(400).json({
      success: false,
      message: `Can only ${action} a THREAD or TOPIC`,
    });
  }

  const post = await postType.findFirst({
    where: {
      id: postId,
    },
    include: {
      createdBy: {
        select: {
          username: true,
        },
      },
    },
  });

  if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

  try {
    // These need to be in an 'all or nothing' transaction.
    // If one fails, so should the other.
    await prisma.$transaction([
      prisma.modAudit.create({
        data: {
          title: post.title,
          body: post.body,
          postedBy: post.createdBy.username,
          reason: post.title,
          action: `${action} ${type}`,
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
        },
      }),
      postType.update({
        where: {
          id: post.id,
        },
        data: {
          pinned: action === 'PIN',
        },
      }),
    ]);

    return res.status(200).json({ success: true, message: `Post ${action}-ed.` });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  }
};

const banIp = async (req: Request, res: Response) => {
  const { reason, days, ip } = req.query;
  const { user } = req.session;
  const daysNo = parseInt(days as string, 10);

  try {
    const bannedUntil = new Date();
    bannedUntil.setDate(bannedUntil.getDate() + daysNo);

    await prisma.$transaction(async (tx) => {
      await tx.ban.deleteMany({
        where: {
          ip: ip as string,
          userId: null,
        },
      });

      await tx.modAudit.create({
        data: {
          reason: reason as string,
          body: 'Banning anonymous IP.',
          action: 'BAN IP',
          createdBy: {
            connect: {
              id: user?.id,
            },
          },
        },
      });

      await tx.ban.create({
        data: {
          ip: ip as string,
          expiresAt: bannedUntil,
        },
      });
    });

    return res.status(200).json({
      success: true,
      message: 'IP has been banned.',
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong.',
    });
  }
};

// I don't think this gets used any more.
const createAdminReferral = async (req: Request, res: Response) => {
  const { user } = req.session;

  const code = referralGenerator();
  await prisma.referralCode.create({
    data: {
      code: code, // Make sure it's unique
      user: {
        connect: { id: user?.id },
      },
    },
  });

  return res.status(200).json({
    success: true,
    referralCode: code,
  });
};

const updatePost = async (req: Request, res: Response) => {
  const { type, id } = req.query;
  const { body, title } = req.body;

  const postId = Number(id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const typeToPost: Record<string, any> = {
    TOPIC: prisma.topic,
    THREAD: prisma.thread,
    REPLY: prisma.reply,
  };

  const typeToUpdate = typeToPost[type as string];

  const post = await typeToUpdate.findFirst({
    where: {
      id: postId,
    },
    include: {
      // This is a hack to conditionally include data depending on whether it's a topic/thread/reply.
      ...(type === 'THREAD' && { topic: true }),
      ...(type === 'REPLY' && {
        thread: {
          include: {
            topic: true,
          },
        },
      }),
    },
  });

  if (!post) {
    console.log('Not found');
    return res.status(400).json({
      success: false,
      message: 'Post cannot be found.',
    });
  }

  // This is a hack too...
  const markdownFactory = (type: string) => {
    if (type === 'TOPIC') {
      return createMarkdownRenderer(post.slug);
    } else if (type === 'THREAD') {
      return createMarkdownRenderer(post.slug, post.slug, post.globalCount);
    } else {
      return createMarkdownRenderer(post.slug, post.thread.slug, post.thread.globalCount);
    }
  };

  const md = markdownFactory(type as string);

  try {
    const updateObj = {
      title,
      body,
      bodyHtml: md.render(body),
    };

    // Replies don't have titles
    if (type === 'REPLY') {
      delete updateObj.title;
    }

    await typeToUpdate.update({
      where: {
        id: post.id,
      },
      data: updateObj,
    });

    return res.status(200).json({
      success: true,
      message: 'Your reply has been updated.',
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      success: false,
      message: 'Internal server error - something went wrong.',
    });
  }
};

export {
  getAdminPage,
  deleteGeneric,
  banUser,
  unbanUser,
  pinOrUnpinPost,
  banIp,
  createAdminReferral,
  updatePost,
};
