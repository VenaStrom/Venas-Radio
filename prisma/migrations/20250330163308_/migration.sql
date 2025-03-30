/*
  Warnings:

  - You are about to drop the `ChannelMeta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProgramMeta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `userId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `channelMetaId` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `podFileId` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `programMetaId` on the `Episode` table. All the data in the column will be lost.
  - The primary key for the `PodFile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `PodFile` table. All the data in the column will be lost.
  - You are about to drop the column `broadcastinfo` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `channelMetaId` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Program` table. All the data in the column will be lost.
  - Added the required column `podfile_id` to the `PodFile` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastFetchUTC` to the `Program` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ChannelMeta_channelId_key";

-- DropIndex
DROP INDEX "ProgramMeta_programId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ChannelMeta";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProgramMeta";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ChannelToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChannelToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChannelToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProgramToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProgramToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProgramToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageHD" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "liveAudioURL" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "scheduleURL" TEXT
);
INSERT INTO "new_Channel" ("channelType", "color", "id", "image", "imageHD", "liveAudioURL", "name", "scheduleURL", "tagline") SELECT "channelType", "color", "id", "image", "imageHD", "liveAudioURL", "name", "scheduleURL", "tagline" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
CREATE UNIQUE INDEX "Channel_id_key" ON "Channel"("id");
CREATE TABLE "new_Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publishDateUTC" DATETIME NOT NULL,
    "image" TEXT NOT NULL,
    "imageHD" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    "channelId" INTEGER,
    CONSTRAINT "Episode_id_fkey" FOREIGN KEY ("id") REFERENCES "PodFile" ("podfile_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("channelId", "description", "id", "image", "imageHD", "programId", "publishDateUTC", "title") SELECT "channelId", "description", "id", "image", "imageHD", "programId", "publishDateUTC", "title" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_id_key" ON "Episode"("id");
CREATE TABLE "new_PodFile" (
    "podfile_id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileSizeInBytes" INTEGER NOT NULL,
    "publishDateUTC" DATETIME NOT NULL,
    "url" TEXT NOT NULL,
    "programId" INTEGER NOT NULL
);
INSERT INTO "new_PodFile" ("description", "duration", "fileSizeInBytes", "programId", "publishDateUTC", "title", "url") SELECT "description", "duration", "fileSizeInBytes", "programId", "publishDateUTC", "title", "url" FROM "PodFile";
DROP TABLE "PodFile";
ALTER TABLE "new_PodFile" RENAME TO "PodFile";
CREATE UNIQUE INDEX "PodFile_podfile_id_key" ON "PodFile"("podfile_id");
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
    "channelId" INTEGER NOT NULL,
    "programCategoryId" INTEGER,
    "lastFetchUTC" DATETIME NOT NULL,
    CONSTRAINT "Program_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Program_programCategoryId_fkey" FOREIGN KEY ("programCategoryId") REFERENCES "ProgramCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("channelId", "description", "id", "imageSquare", "imageSquareHD", "imageWide", "imageWideHD", "name", "payoff", "programCategoryId") SELECT "channelId", "description", "id", "imageSquare", "imageSquareHD", "imageWide", "imageWideHD", "name", "payoff", "programCategoryId" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE UNIQUE INDEX "Program_id_key" ON "Program"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelToUser_AB_unique" ON "_ChannelToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelToUser_B_index" ON "_ChannelToUser"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToUser_AB_unique" ON "_ProgramToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToUser_B_index" ON "_ProgramToUser"("B");
