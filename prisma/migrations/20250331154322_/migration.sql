-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageSquare" TEXT NOT NULL,
    "imageSquareHD" TEXT NOT NULL,
    "imageWide" TEXT NOT NULL,
    "imageWideHD" TEXT NOT NULL,
    "broadcastInfo" TEXT,
    "payoff" TEXT,
    "channelId" INTEGER,
    "programCategoryId" INTEGER,
    "lastFetchUTC" DATETIME NOT NULL,
    CONSTRAINT "Program_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Program_programCategoryId_fkey" FOREIGN KEY ("programCategoryId") REFERENCES "ProgramCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("broadcastInfo", "channelId", "description", "id", "imageSquare", "imageSquareHD", "imageWide", "imageWideHD", "lastFetchUTC", "name", "payoff", "programCategoryId") SELECT "broadcastInfo", "channelId", "description", "id", "imageSquare", "imageSquareHD", "imageWide", "imageWideHD", "lastFetchUTC", "name", "payoff", "programCategoryId" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE UNIQUE INDEX "Program_id_key" ON "Program"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
