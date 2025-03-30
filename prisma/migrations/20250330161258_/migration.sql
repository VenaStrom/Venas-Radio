/*
  Warnings:

  - You are about to drop the `_ChannelToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProgramToUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `imageTemplate` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `scheduleUrl` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `siteUrl` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `xmltvId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `audioDuration` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `audioPreference` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `audioPriority` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `audioUrl` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrlTemplate` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `photographer` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `publishDateUtc` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Episode` table. All the data in the column will be lost.
  - You are about to alter the column `programMetaId` on the `Episode` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `archived` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `broadcastInfo` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `hasOnDemand` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `hasPod` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programImage` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programImageTemplate` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programImageTemplateWide` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programImageWide` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programSlug` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `programUrl` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `responsibleEditor` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `socialImage` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `socialImageTemplate` on the `Program` table. All the data in the column will be lost.
  - The primary key for the `ProgramMeta` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `ProgramMeta` table. All the data in the column will be lost.
  - You are about to drop the column `lastFetch` on the `ProgramMeta` table. All the data in the column will be lost.
  - You are about to drop the column `programMetaId` on the `User` table. All the data in the column will be lost.
  - Added the required column `imageHD` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liveAudioURL` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageHD` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `podFileId` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishDateUTC` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageSquare` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageSquareHD` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageWide` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageWideHD` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastFetchUTC` to the `ProgramMeta` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_ChannelToUser_B_index";

-- DropIndex
DROP INDEX "_ChannelToUser_AB_unique";

-- DropIndex
DROP INDEX "_ProgramToUser_B_index";

-- DropIndex
DROP INDEX "_ProgramToUser_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ChannelToUser";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ProgramToUser";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ChannelMeta" (
    "channelId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    CONSTRAINT "ChannelMeta_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProgramCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PodFile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "fileSizeInBytes" INTEGER NOT NULL,
    "publishDateUTC" DATETIME NOT NULL,
    "url" TEXT NOT NULL,
    "programId" INTEGER NOT NULL,
    CONSTRAINT "PodFile_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServerMeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastChannelIndexFetchUTC" DATETIME NOT NULL,
    "lastProgramIndexFetchUTC" DATETIME NOT NULL
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
    "scheduleURL" TEXT,
    "userId" TEXT,
    CONSTRAINT "Channel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Channel" ("channelType", "color", "id", "image", "name", "tagline") SELECT "channelType", "color", "id", "image", "name", "tagline" FROM "Channel";
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
    "channelMetaId" INTEGER,
    "programMetaId" INTEGER,
    "podFileId" INTEGER NOT NULL,
    CONSTRAINT "Episode_podFileId_fkey" FOREIGN KEY ("podFileId") REFERENCES "PodFile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Episode_channelMetaId_fkey" FOREIGN KEY ("channelMetaId") REFERENCES "ChannelMeta" ("channelId") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Episode_programMetaId_fkey" FOREIGN KEY ("programMetaId") REFERENCES "ProgramMeta" ("programId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("channelId", "description", "id", "programId", "programMetaId", "title") SELECT "channelId", "description", "id", "programId", "programMetaId", "title" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_id_key" ON "Episode"("id");
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageSquare" TEXT NOT NULL,
    "imageSquareHD" TEXT NOT NULL,
    "imageWide" TEXT NOT NULL,
    "imageWideHD" TEXT NOT NULL,
    "broadcastinfo" TEXT,
    "payoff" TEXT,
    "channelId" INTEGER NOT NULL,
    "programCategoryId" INTEGER,
    "userId" TEXT,
    "channelMetaId" INTEGER,
    CONSTRAINT "Program_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Program_programCategoryId_fkey" FOREIGN KEY ("programCategoryId") REFERENCES "ProgramCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Program_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Program_channelMetaId_fkey" FOREIGN KEY ("channelMetaId") REFERENCES "ChannelMeta" ("channelId") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("channelId", "description", "id", "name", "payoff") SELECT "channelId", "description", "id", "name", "payoff" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE UNIQUE INDEX "Program_id_key" ON "Program"("id");
CREATE TABLE "new_ProgramMeta" (
    "programId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastFetchUTC" DATETIME NOT NULL,
    CONSTRAINT "ProgramMeta_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProgramMeta" ("programId") SELECT "programId" FROM "ProgramMeta";
DROP TABLE "ProgramMeta";
ALTER TABLE "new_ProgramMeta" RENAME TO "ProgramMeta";
CREATE UNIQUE INDEX "ProgramMeta_programId_key" ON "ProgramMeta"("programId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fetchSpan" INTEGER NOT NULL DEFAULT 7,
    "feedSort" TEXT NOT NULL
);
INSERT INTO "new_User" ("feedSort", "fetchSpan", "id") SELECT "feedSort", "fetchSpan", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ChannelMeta_channelId_key" ON "ChannelMeta"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCategory_id_key" ON "ProgramCategory"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramCategory_name_key" ON "ProgramCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PodFile_id_key" ON "PodFile"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ServerMeta_id_key" ON "ServerMeta"("id");
