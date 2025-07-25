-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT,
    "reason" TEXT NOT NULL,
    "postedBy" TEXT,
    "action" TEXT NOT NULL,
    CONSTRAINT "ModAudit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModAudit" ("action", "body", "createdAt", "createdById", "id", "postedBy", "reason", "title", "updatedAt") SELECT "action", "body", "createdAt", "createdById", "id", "postedBy", "reason", "title", "updatedAt" FROM "ModAudit";
DROP TABLE "ModAudit";
ALTER TABLE "new_ModAudit" RENAME TO "ModAudit";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
