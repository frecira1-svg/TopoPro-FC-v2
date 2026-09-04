/*
  Warnings:

  - A unique constraint covering the columns `[emailVerificationToken]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "emailVerificationExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerificationToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_emailVerificationToken_key" ON "usuarios"("emailVerificationToken");
