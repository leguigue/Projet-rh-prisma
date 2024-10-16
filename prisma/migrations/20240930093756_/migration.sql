/*
  Warnings:

  - You are about to drop the column `email` on the `entreprise` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mail]` on the table `Entreprise` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mail` to the `Entreprise` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Entreprise_email_key` ON `entreprise`;

-- AlterTable
ALTER TABLE `entreprise` DROP COLUMN `email`,
    ADD COLUMN `mail` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `Blame` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `employeId` INTEGER NOT NULL,
    `entrepriseId` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `fonction` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `photo` TEXT NULL,
    `age` INTEGER NOT NULL,
    `sexe` VARCHAR(255) NOT NULL,
    `ordinateurId` INTEGER NULL,
    `entrepriseId` INTEGER NOT NULL,

    UNIQUE INDEX `Employe_email_key`(`email`),
    UNIQUE INDEX `Employe_ordinateurId_key`(`ordinateurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ordinateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `entrepriseId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Entreprise_mail_key` ON `Entreprise`(`mail`);

-- AddForeignKey
ALTER TABLE `Blame` ADD CONSTRAINT `Blame_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Blame` ADD CONSTRAINT `Blame_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `Entreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_ordinateurId_fkey` FOREIGN KEY (`ordinateurId`) REFERENCES `Ordinateur`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employe` ADD CONSTRAINT `Employe_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `Entreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ordinateur` ADD CONSTRAINT `Ordinateur_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `Entreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
