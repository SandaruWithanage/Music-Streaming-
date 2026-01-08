/*
  Warnings:

  - You are about to drop the column `lastPositionSeconds` on the `ListeningHistory` table. All the data in the column will be lost.
  - You are about to drop the column `playedAt` on the `ListeningHistory` table. All the data in the column will be lost.
  - You are about to drop the column `secondsPlayed` on the `ListeningHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,trackId]` on the table `ListeningHistory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ListeningHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ListeningHistory" DROP CONSTRAINT "ListeningHistory_userId_fkey";

-- DropIndex
DROP INDEX "ListeningHistory_trackId_playedAt_idx";

-- DropIndex
DROP INDEX "ListeningHistory_userId_playedAt_idx";

-- AlterTable
ALTER TABLE "ListeningHistory" DROP COLUMN "lastPositionSeconds",
DROP COLUMN "playedAt",
DROP COLUMN "secondsPlayed",
ADD COLUMN     "completedCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastPlayedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastPositionMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "playCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "ListeningHistory_userId_lastPlayedAt_idx" ON "ListeningHistory"("userId", "lastPlayedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ListeningHistory_userId_trackId_key" ON "ListeningHistory"("userId", "trackId");

-- AddForeignKey
ALTER TABLE "ListeningHistory" ADD CONSTRAINT "ListeningHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
