-- CreateTable
CREATE TABLE `activitylog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `resource` VARCHAR(191) NOT NULL,
    `resourceId` INTEGER NOT NULL,
    `details` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ActivityLog_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audittrail` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `tableName` VARCHAR(191) NOT NULL,
    `recordId` INTEGER NOT NULL,
    `oldValues` JSON NULL,
    `newValues` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `hash` VARCHAR(191) NULL,
    `previousHash` VARCHAR(191) NULL,

    INDEX `audittrail_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prf` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prfNo` VARCHAR(191) NULL,
    `dateRequested` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateNeeded` DATETIME(3) NULL,
    `to` VARCHAR(191) NULL,
    `from` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `quotationSummary` VARCHAR(191) NULL,
    `preparedById` INTEGER NULL,
    `verifiedById` INTEGER NULL,
    `notedById` INTEGER NULL,
    `approvedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `layout` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `authorId` INTEGER NULL,
    `requestorId` INTEGER NULL,
    `department` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `archivedById` INTEGER NULL,
    `disapprovalReason` VARCHAR(191) NULL,

    INDEX `prf_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prfitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `qty` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `particulars` VARCHAR(191) NULL,
    `estimatedCost` VARCHAR(191) NULL,
    `availableStocks` VARCHAR(191) NULL,
    `prfId` INTEGER NOT NULL,

    INDEX `PrfItem_prfId_fkey`(`prfId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminder` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,

    INDEX `Reminder_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfp` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rfpNo` VARCHAR(191) NULL,
    `requestorId` INTEGER NULL,
    `dateRequested` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dateNeeded` DATETIME(3) NULL,
    `to` VARCHAR(191) NULL,
    `from` VARCHAR(191) NULL,
    `department` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `remarks` VARCHAR(191) NULL,
    `preparedById` INTEGER NULL,
    `verifiedById` INTEGER NULL,
    `approvedById` INTEGER NULL,
    `layout` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `authorId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `archivedById` INTEGER NULL,
    `receivedBy` VARCHAR(191) NULL,
    `receivedDate` DATETIME(3) NULL,
    `disapprovalReason` VARCHAR(191) NULL,

    INDEX `rfp_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rfpitem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `qty` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `particulars` VARCHAR(191) NULL,
    `estimatedCost` VARCHAR(191) NULL,
    `availableStocks` VARCHAR(191) NULL,
    `rfpId` INTEGER NOT NULL,

    INDEX `RfpItem_rfpId_fkey`(`rfpId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tripticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dateRequested` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `requestorId` INTEGER NULL,
    `subsidiary` VARCHAR(191) NULL,
    `driverId` INTEGER NULL,
    `vehicle` VARCHAR(191) NULL,
    `vehicleId` INTEGER NULL,
    `plateNumber` VARCHAR(191) NULL,
    `etdOffice` VARCHAR(191) NULL,
    `etaDestination` VARCHAR(191) NULL,
    `dateTimeDeparture` DATETIME(3) NULL,
    `dateTimeReturn` DATETIME(3) NULL,
    `passengersDetail` VARCHAR(191) NULL,
    `destination` VARCHAR(191) NULL,
    `purpose` VARCHAR(191) NULL,
    `medium` VARCHAR(191) NULL,
    `requestedById` INTEGER NULL,
    `endorsedById` INTEGER NULL,
    `approvedById` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `layout` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `authorId` INTEGER NULL,
    `guardInId` INTEGER NULL,
    `guardOutId` INTEGER NULL,
    `kmIn` VARCHAR(191) NULL,
    `kmOut` VARCHAR(191) NULL,
    `hdiPassengers` VARCHAR(191) NULL,
    `outsidePassengers` VARCHAR(191) NULL,
    `passengerCount` VARCHAR(191) NULL,
    `archivedById` INTEGER NULL,
    `disapprovalReason` VARCHAR(191) NULL,

    INDEX `tripticket_authorId_idx`(`authorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `canApprove` BOOLEAN NOT NULL DEFAULT false,
    `canApprovePRF` BOOLEAN NOT NULL DEFAULT false,
    `canApproveTripTicket` BOOLEAN NOT NULL DEFAULT false,
    `canApproveRFP` BOOLEAN NOT NULL DEFAULT false,
    `canApproveDeptHead` BOOLEAN NOT NULL DEFAULT false,
    `canEndorse` BOOLEAN NOT NULL DEFAULT false,
    `canVerify` BOOLEAN NOT NULL DEFAULT false,
    `signatureUrl` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `themeColor` VARCHAR(191) NULL DEFAULT '#0f172a',
    `isDarkMode` BOOLEAN NOT NULL DEFAULT false,
    `role` ENUM('User', 'Admin', 'Driver', 'Guard', 'Accounting', 'IT') NOT NULL DEFAULT 'User',
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `inactiveReason` TEXT NULL,
    `companyId` INTEGER NULL,
    `departmentId` INTEGER NULL,
    `departmentRole` ENUM('President', 'DepartmentHead', 'ImmediateSupervisor', 'Staff') NULL,
    `isDriver` BOOLEAN NOT NULL DEFAULT false,
    `isRFPApprover` BOOLEAN NOT NULL DEFAULT false,
    `isSecurityGuard` BOOLEAN NOT NULL DEFAULT false,
    `isITSpecialist` BOOLEAN NOT NULL DEFAULT false,
    `permissions` JSON NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supportticket` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Pending',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'Medium',
    `category` VARCHAR(191) NOT NULL DEFAULT 'Others',
    `authorId` INTEGER NOT NULL,
    `assignedToId` INTEGER NULL,
    `resolvedById` INTEGER NULL,
    `resolutionNotes` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `plateNumber` VARCHAR(191) NOT NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `year` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `fuelType` VARCHAR(191) NULL,
    `transmission` VARCHAR(191) NULL,
    `engineNumber` VARCHAR(191) NULL,
    `chassisNumber` VARCHAR(191) NULL,
    `capacity` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `companyId` INTEGER NULL,
    `departmentId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supportmessage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ticketId` INTEGER NOT NULL,
    `senderId` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `message` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `link` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `targetRole` VARCHAR(191) NULL,
    `targetUserId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notification_targetUserId_idx`(`targetUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `company` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `logoUrl` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `company_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `activitylog` ADD CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audittrail` ADD CONSTRAINT `audittrail_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_preparedById_fkey` FOREIGN KEY (`preparedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_verifiedById_fkey` FOREIGN KEY (`verifiedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_notedById_fkey` FOREIGN KEY (`notedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_archivedById_fkey` FOREIGN KEY (`archivedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prf` ADD CONSTRAINT `prf_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prfitem` ADD CONSTRAINT `PrfItem_prfId_fkey` FOREIGN KEY (`prfId`) REFERENCES `prf`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminder` ADD CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `task` ADD CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_requestorId_fkey` FOREIGN KEY (`requestorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_endorsedById_fkey` FOREIGN KEY (`endorsedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_guardInId_fkey` FOREIGN KEY (`guardInId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_guardOutId_fkey` FOREIGN KEY (`guardOutId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_archivedById_fkey` FOREIGN KEY (`archivedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tripticket` ADD CONSTRAINT `tripticket_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportticket` ADD CONSTRAINT `supportticket_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportticket` ADD CONSTRAINT `supportticket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportticket` ADD CONSTRAINT `supportticket_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicle` ADD CONSTRAINT `vehicle_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportmessage` ADD CONSTRAINT `supportmessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `supportticket`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `supportmessage` ADD CONSTRAINT `supportmessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
