-- CreateTable
CREATE TABLE "EpisodeProgress" (
    "progress" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    PRIMARY KEY ("user_id", "episode_id"),
    CONSTRAINT "EpisodeProgress_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "Episode" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EpisodeProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fetchSpan" INTEGER NOT NULL DEFAULT 7,
    "feedSort" TEXT NOT NULL DEFAULT 'OLDEST_PER_DAY'
);
INSERT INTO "new_User" ("feedSort", "fetchSpan", "id") SELECT "feedSort", "fetchSpan", "id" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
