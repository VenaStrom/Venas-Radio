-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "publishDate" DATETIME NOT NULL,
    "lastFetch" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" INTEGER,
    CONSTRAINT "Program_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("channelId", "id", "name", "publishDate") SELECT "channelId", "id", "name", "publishDate" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE UNIQUE INDEX "Program_id_key" ON "Program"("id");
CREATE UNIQUE INDEX "Program_name_key" ON "Program"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
