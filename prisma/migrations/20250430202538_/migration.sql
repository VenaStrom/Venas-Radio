/*
  Warnings:

  - You are about to drop the column `progress` on the `EpisodeProgress` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EpisodeProgress" (
    "progressMS" INTEGER NOT NULL DEFAULT 0,
    "episode_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "episode_id"),
    CONSTRAINT "EpisodeProgress_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpisodeProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EpisodeProgress" ("episode_id", "user_id") SELECT "episode_id", "user_id" FROM "EpisodeProgress";
DROP TABLE "EpisodeProgress";
ALTER TABLE "new_EpisodeProgress" RENAME TO "EpisodeProgress";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
