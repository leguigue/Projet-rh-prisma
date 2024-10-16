/*
  Warnings:

  - You are about to drop the column `name` on the `employe` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `employe` table. All the data in the column will be lost.
  - You are about to alter the column `sexe` on the `employe` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(50)`.
  - A unique constraint covering the columns `[macAddress]` on the table `Ordinateur` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firstName` to the `Employe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Employe` table without a default value. This is not possible if the table is not empty.
  - Added the required column `macAddress` to the `Ordinateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `employe` DROP COLUMN `name`,
    DROP COLUMN `photo`,
    ADD COLUMN `avatar` TEXT NULL,
    ADD COLUMN `firstName` VARCHAR(255) NOT NULL,
    ADD COLUMN `lastName` VARCHAR(255) NOT NULL,
    MODIFY `age` INTEGER NULL,
    MODIFY `sexe` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `ordinateur` ADD COLUMN `macAddress` VARCHAR(17) NOT NULL;

-- CreateTable
CREATE TABLE `Tache` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `deadline` DATETIME(3) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `fichierPath` TEXT NULL,
    `employeId` INTEGER NOT NULL,
    `entrepriseId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Ordinateur_macAddress_key` ON `Ordinateur`(`macAddress`);

-- AddForeignKey
ALTER TABLE `Tache` ADD CONSTRAINT `Tache_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Tache` ADD CONSTRAINT `Tache_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `Entreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
