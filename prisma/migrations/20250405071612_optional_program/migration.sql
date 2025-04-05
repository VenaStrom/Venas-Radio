-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publishDateUTC" DATETIME NOT NULL,
    "imageSquare" TEXT NOT NULL,
    "imageWideHD" TEXT NOT NULL,
    "programId" INTEGER,
    "channelId" INTEGER,
    CONSTRAINT "Episode_id_fkey" FOREIGN KEY ("id") REFERENCES "PodFile" ("podfile_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Episode_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("channelId", "description", "id", "imageSquare", "imageWideHD", "programId", "publishDateUTC", "title") SELECT "channelId", "description", "id", "imageSquare", "imageWideHD", "programId", "publishDateUTC", "title" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_id_key" ON "Episode"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
