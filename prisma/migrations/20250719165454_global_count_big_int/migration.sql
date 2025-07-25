/*
  Warnings:

  - You are about to alter the column `globalCount` on the `Reply` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `globalCount` on the `Thread` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "globalCount" BIGINT NOT NULL,
    "ip" TEXT NOT NULL,
    "progName" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Reply_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reply" ("body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "progName", "threadId", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "progName", "threadId", "updatedAt" FROM "Reply";
DROP TABLE "Reply";
ALTER TABLE "new_Reply" RENAME TO "Reply";
CREATE TABLE "new_Thread" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "topicId" INTEGER NOT NULL,
    "lastBumped" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "globalCount" BIGINT NOT NULL,
    "replyCount" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "ip" TEXT NOT NULL,
    CONSTRAINT "Thread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Thread_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "lastBumped", "pinned", "replyCount", "title", "topicId", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "lastBumped", "pinned", "replyCount", "title", "topicId", "updatedAt" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
