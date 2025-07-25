/*
  Warnings:

  - You are about to drop the column `totalId` on the `Topic` table. All the data in the column will be lost.
  - Added the required column `globalCount` to the `Reply` table without a default value. This is not possible if the table is not empty.
  - Added the required column `globalCount` to the `Thread` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Topic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "lastBumped" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topicCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Topic_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Topic" ("body", "bodyHtml", "createdAt", "createdById", "id", "lastBumped", "slug", "title", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "id", "lastBumped", "slug", "title", "updatedAt" FROM "Topic";
DROP TABLE "Topic";
ALTER TABLE "new_Topic" RENAME TO "Topic";
CREATE UNIQUE INDEX "Topic_slug_key" ON "Topic"("slug");
CREATE TABLE "new_Reply" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "globalCount" INTEGER NOT NULL,
    CONSTRAINT "Reply_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reply_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Reply" ("body", "bodyHtml", "createdAt", "createdById", "id", "threadId", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "id", "threadId", "updatedAt" FROM "Reply";
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
    "globalCount" INTEGER NOT NULL,
    CONSTRAINT "Thread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Thread_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("body", "bodyHtml", "createdAt", "createdById", "id", "lastBumped", "title", "topicId", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "id", "lastBumped", "title", "topicId", "updatedAt" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
