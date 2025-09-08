/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Petition` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creatorId` to the `Petition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicId` to the `Petition` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Petition" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "creatorId" TEXT NOT NULL,
ADD COLUMN     "publicId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Petition_publicId_key" ON "public"."Petition"("publicId");

-- AddForeignKey
ALTER TABLE "public"."Petition" ADD CONSTRAINT "Petition_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
