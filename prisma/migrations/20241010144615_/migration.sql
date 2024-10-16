-- AlterTable
ALTER TABLE `ordinateur` ADD COLUMN `adresse` TEXT NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;

-- CreateTable
CREATE TABLE `Panne` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` TEXT NOT NULL,
    `dateDeclaration` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolu` BOOLEAN NOT NULL DEFAULT false,
    `ordinateurId` INTEGER NOT NULL,
    `employeId` INTEGER NOT NULL,
    `entrepriseId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Panne` ADD CONSTRAINT `Panne_ordinateurId_fkey` FOREIGN KEY (`ordinateurId`) REFERENCES `Ordinateur`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Panne` ADD CONSTRAINT `Panne_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Panne` ADD CONSTRAINT `Panne_entrepriseId_fkey` FOREIGN KEY (`entrepriseId`) REFERENCES `Entreprise`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
