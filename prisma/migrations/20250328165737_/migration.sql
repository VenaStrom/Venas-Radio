/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Program` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Program_name_key" ON "Program"("name");
