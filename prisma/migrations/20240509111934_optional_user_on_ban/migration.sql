-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ban" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ip" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Ban" ("createdAt", "expiresAt", "id", "ip", "userId") SELECT "createdAt", "expiresAt", "id", "ip", "userId" FROM "Ban";
DROP TABLE "Ban";
ALTER TABLE "new_Ban" RENAME TO "Ban";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
