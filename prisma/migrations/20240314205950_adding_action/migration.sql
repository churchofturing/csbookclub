/*
  Warnings:

  - Added the required column `action` to the `ModAudit` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ModAudit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "postedBy" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    CONSTRAINT "ModAudit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ModAudit" ("body", "createdAt", "createdById", "id", "postedBy", "reason", "title", "updatedAt") SELECT "body", "createdAt", "createdById", "id", "postedBy", "reason", "title", "updatedAt" FROM "ModAudit";
DROP TABLE "ModAudit";
ALTER TABLE "new_ModAudit" RENAME TO "ModAudit";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
