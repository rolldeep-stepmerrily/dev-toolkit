/*
  Warnings:

  - You are about to drop the `ToolHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ToolHistory" DROP CONSTRAINT "ToolHistory_userId_fkey";

-- DropTable
DROP TABLE "ToolHistory";
