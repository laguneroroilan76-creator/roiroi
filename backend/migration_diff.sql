-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_approvedById_fkey`;

-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_archivedById_fkey`;

-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_authorId_fkey`;

-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_preparedById_fkey`;

-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_requestorId_fkey`;

-- DropForeignKey
ALTER TABLE `rrf` DROP FOREIGN KEY `rrf_verifiedById_fkey`;

-- DropForeignKey
ALTER TABLE `rrfitem` DROP FOREIGN KEY `RrfItem_rrfId_fkey`;

-- DropIndex
DROP INDEX `rfp_approvedById_fkey` ON `rfp`;

-- DropIndex
DROP INDEX `rfp_archivedById_fkey` ON `rfp`;

-- DropIndex
DROP INDEX `rfp_preparedById_fkey` ON `rfp`;

-- DropIndex
DROP INDEX `rfp_requestorId_fkey` ON `rfp`;

-- DropIndex
DROP INDEX `rfp_verifiedById_fkey` ON `rfp`;

-- AlterTable
ALTER TABLE `company` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

-- AlterTable
ALTER TABLE `rfp` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `rfpitem` MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT;

-- AlterTable
ALTER TABLE `tripticket` ADD COLUMN `vehicleId` INTEGER NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `company`,
    ADD COLUMN `departmentId` INTEGER NULL,
    ADD COLUMN `departmentRole` ENUM('President', 'DepartmentHead', 'ImmediateSupervisor', 'Staff') NULL,
    ADD COLUMN `isDriver` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isITSpecialist` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isRFPApprover` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isSecurityGuard` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `vehicle` ADD COLUMN `capacity` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `companyId` INTEGER NULL,
    ADD COLUMN `departmentId` INTEGER NULL;

-- DropTable
DROP TABLE `rrf`;

-- DropTable
DROP TABLE `rrfitem`;

-- CreateTable
CREATE TABLE `department` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `department_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_preparedById_fkey` FOREIGN KEY (`preparedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_archivedById_fkey` FOREIGN KEY (`archivedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfp` ADD CONSTRAINT `rfp_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rfpitem` ADD CONSTRAINT `RfpItem_rfpId_fkey` FOREIGN KEY (`rfpId`) REFERENCES `rfp`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

