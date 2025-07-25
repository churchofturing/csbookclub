-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "slug" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "Thread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Thread_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Thread" ("body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "lastBumped", "pinned", "replyCount", "title", "topicId", "updatedAt") SELECT "body", "bodyHtml", "createdAt", "createdById", "globalCount", "id", "ip", "lastBumped", "pinned", "replyCount", "title", "topicId", "updatedAt" FROM "Thread";
DROP TABLE "Thread";
ALTER TABLE "new_Thread" RENAME TO "Thread";
CREATE INDEX "Thread_topicId_pinned_lastBumped_idx" ON "Thread"("topicId", "pinned", "lastBumped");
CREATE INDEX "Thread_createdById_idx" ON "Thread"("createdById");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
