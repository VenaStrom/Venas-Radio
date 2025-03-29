-- CreateTable
CREATE TABLE "ServerMeta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "lastProgramsFetch" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ServerMeta_id_key" ON "ServerMeta"("id");
