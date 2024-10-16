/*
  Warnings:

  - Added the required column `nom` to the `Ordinateur` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ordinateur` ADD COLUMN `nom` VARCHAR(255) NOT NULL;
