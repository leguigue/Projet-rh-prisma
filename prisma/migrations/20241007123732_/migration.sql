-- DropForeignKey
ALTER TABLE `tache` DROP FOREIGN KEY `Tache_employeId_fkey`;

-- AddForeignKey
ALTER TABLE `Tache` ADD CONSTRAINT `Tache_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
