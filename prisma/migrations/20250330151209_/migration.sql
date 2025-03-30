/*
  Warnings:

  - You are about to drop the `ServerMeta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `userId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `publishDate` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `lastFetch` on the `Program` table. All the data in the column will be lost.
  - You are about to drop the column `publishDate` on the `Program` table. All the data in the column will be lost.
  - Added the required column `channelType` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `image` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageTemplate` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `siteUrl` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagline` to the `Channel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publishDateUtc` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `Episode` table without a default value. This is not possible if the table is not empty.
  - Made the column `programId` on table `Episode` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `description` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programImage` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programImageTemplate` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programUrl` to the `Program` table without a default value. This is not possible if the table is not empty.
  - Made the column `channelId` on table `Program` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "ServerMeta_id_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ServerMeta";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ProgramMeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastFetch" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "programId" INTEGER NOT NULL,
    CONSTRAINT "ProgramMeta_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ChannelToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ChannelToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Channel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ChannelToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Channel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "channelType" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "imageTemplate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "siteUrl" TEXT NOT NULL,
    "scheduleUrl" TEXT,
    "xmltvId" TEXT
);
INSERT INTO "new_Channel" ("id", "name") SELECT "id", "name" FROM "Channel";
DROP TABLE "Channel";
ALTER TABLE "new_Channel" RENAME TO "Channel";
CREATE TABLE "new_Episode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "audioPreference" TEXT,
    "audioPriority" TEXT,
    "publishDateUtc" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "imageUrlTemplate" TEXT,
    "photographer" TEXT,
    "audioUrl" TEXT,
    "audioDuration" INTEGER,
    "programId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "programMetaId" TEXT,
    CONSTRAINT "Episode_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Episode_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Episode_programMetaId_fkey" FOREIGN KEY ("programMetaId") REFERENCES "ProgramMeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("channelId", "id", "programId") SELECT "channelId", "id", "programId" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE TABLE "new_Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "programUrl" TEXT NOT NULL,
    "programImage" TEXT NOT NULL,
    "programImageTemplate" TEXT NOT NULL,
    "programImageWide" TEXT,
    "programImageTemplateWide" TEXT,
    "socialImage" TEXT,
    "socialImageTemplate" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "hasOnDemand" BOOLEAN NOT NULL DEFAULT false,
    "hasPod" BOOLEAN NOT NULL DEFAULT false,
    "responsibleEditor" TEXT,
    "broadcastInfo" TEXT,
    "programSlug" TEXT,
    "payoff" TEXT,
    "channelId" INTEGER NOT NULL,
    CONSTRAINT "Program_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Program" ("channelId", "id", "name") SELECT "channelId", "id", "name" FROM "Program";
DROP TABLE "Program";
ALTER TABLE "new_Program" RENAME TO "Program";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fetchSpan" INTEGER NOT NULL DEFAULT 7,
    "feedSort" TEXT NOT NULL DEFAULT 'oldest-per-day',
    "programMetaId" TEXT,
    CONSTRAINT "User_programMetaId_fkey" FOREIGN KEY ("programMetaId") REFERENCES "ProgramMeta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("feedSort", "fetchSpan", "id") SELECT "feedSort", "fetchSpan", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProgramMeta_id_key" ON "ProgramMeta"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProgramMeta_programId_key" ON "ProgramMeta"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "_ChannelToUser_AB_unique" ON "_ChannelToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ChannelToUser_B_index" ON "_ChannelToUser"("B");
