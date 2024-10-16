/*
  Warnings:

  - You are about to drop the column `employeId` on the `ordinateur` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ordinateurId]` on the table `Employe` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `ordinateur` DROP FOREIGN KEY `Ordinateur_employeId_fkey`;

-- AlterTable
ALTER TABLE `employe` ADD COLUMN `ordinateurId` INTEGER NULL;

-- AlterTable
ALTER TABLE `ordinateur` DROP COLUMN `employeId`;

-- CreateIndex
CREATE UNIQUE INDEX `Employe_ordinateurId_key` ON `Employe`(`ordinateurId`);

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_ordinateurId_fkey` FOREIGN KEY (`ordinateurId`) REFERENCES `Ordinateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
