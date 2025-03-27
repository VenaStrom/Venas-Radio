-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "Program" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
);

-- CreateTable
CREATE TABLE "_ProgramToUser" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProgramToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Program" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProgramToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Program_id_key" ON "Program"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_ProgramToUser_AB_unique" ON "_ProgramToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_ProgramToUser_B_index" ON "_ProgramToUser"("B");
