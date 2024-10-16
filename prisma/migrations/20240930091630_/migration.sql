-- CreateTable
CREATE TABLE `Entreprise` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `siret` CHAR(14) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `director` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Entreprise_siret_key`(`siret`),
    UNIQUE INDEX `Entreprise_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
