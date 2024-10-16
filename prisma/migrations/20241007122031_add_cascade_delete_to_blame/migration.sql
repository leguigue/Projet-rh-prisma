-- DropForeignKey
ALTER TABLE `blame` DROP FOREIGN KEY `Blame_employeId_fkey`;

-- AddForeignKey
ALTER TABLE `Blame` ADD CONSTRAINT `Blame_employeId_fkey` FOREIGN KEY (`employeId`) REFERENCES `Employe`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
