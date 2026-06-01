-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: hdi_db
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activitylog`
--

DROP TABLE IF EXISTS `activitylog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activitylog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resourceId` int NOT NULL,
  `details` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `ActivityLog_userId_fkey` (`userId`),
  CONSTRAINT `ActivityLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activitylog`
--

LOCK TABLES `activitylog` WRITE;
/*!40000 ALTER TABLE `activitylog` DISABLE KEYS */;
INSERT INTO `activitylog` VALUES (1,1,'CREATE','TRIP_TICKET',1,'System Administrator created Trip Ticket for System Administrator','2026-05-25 01:11:18.988'),(2,1,'CREATE','PRF',1,'System Administrator created PRF #1','2026-05-25 01:12:57.890'),(3,1,'CREATE','RFP',1,'System Administrator created RFP #1','2026-05-25 01:13:00.265'),(4,1,'UPDATE','TRIP_TICKET',1,'System Administrator updated status to Pending Approval','2026-05-25 01:13:17.610'),(5,1,'UPDATE','RFP',1,'System Administrator updated RFP status to Pending Final Approval','2026-05-25 01:13:20.890'),(6,1,'UPDATE','PRF',1,'System Administrator updated PRF status to Pending Approval','2026-05-25 01:13:25.783'),(7,1,'APPROVE','TRIP_TICKET',1,'System Administrator approved Trip Ticket','2026-05-25 01:13:30.130'),(8,1,'APPROVE','RFP',1,'System Administrator approved RFP','2026-05-25 01:13:32.762'),(9,1,'APPROVE','PRF',1,'System Administrator approved PRF','2026-05-25 01:13:46.615'),(10,1,'CREATE','RFP',2,'System Administrator created RFP #2','2026-05-25 01:14:37.775'),(11,1,'UPDATE','RFP',2,'System Administrator updated RFP status to Pending Final Approval','2026-05-25 01:14:59.251'),(12,1,'CREATE','RFP',3,'System Administrator created RFP #1231','2026-05-25 01:16:58.777'),(13,1,'APPROVE','RFP',2,'System Administrator approved RFP','2026-05-25 01:17:12.760'),(14,1,'UPDATE','RFP',3,'System Administrator updated RFP status to Pending Final Approval','2026-05-25 01:17:17.732'),(15,1,'APPROVE','RFP',3,'System Administrator approved RFP','2026-05-25 01:17:22.737'),(16,2,'APPROVE','RFP',3,'accounting approved RFP','2026-05-25 03:03:10.523'),(17,2,'APPROVE','RFP',2,'accounting approved RFP','2026-05-25 03:07:40.635'),(18,2,'APPROVE','RFP',1,'accounting approved RFP','2026-05-25 03:07:54.388'),(19,1,'CREATE','RFP',4,'System Administrator created RFP #4','2026-05-25 03:11:52.426'),(20,1,'UPDATE','RFP',4,'System Administrator updated RFP status to Pending Final Approval','2026-05-25 03:12:03.092'),(21,1,'APPROVE','RFP',4,'System Administrator approved RFP','2026-05-25 03:12:08.490'),(22,2,'APPROVE','RFP',4,'accounting approved RFP','2026-05-25 03:14:32.488'),(23,1,'CREATE','TRIP_TICKET',2,'System Administrator created Trip Ticket for System Administrator','2026-05-25 05:20:39.565'),(24,2,'CREATE','TRIP_TICKET',3,'accounting created Trip Ticket for accounting','2026-05-25 05:20:51.162'),(25,1,'UPDATE','TRIP_TICKET',3,'System Administrator updated status to Pending Approval','2026-05-25 05:36:12.644'),(26,1,'APPROVE','TRIP_TICKET',3,'System Administrator approved Trip Ticket','2026-05-25 05:36:14.817'),(27,1,'UPDATE','TRIP_TICKET',2,'System Administrator updated status to Pending Approval','2026-05-25 05:36:16.678'),(28,1,'APPROVE','TRIP_TICKET',2,'System Administrator approved Trip Ticket','2026-05-25 05:36:18.306'),(29,2,'CREATE','PRF',2,'accounting created PRF #2','2026-05-25 05:40:24.059'),(30,1,'UPDATE','PRF',2,'System Administrator updated PRF status to Pending Approval','2026-05-25 06:12:28.364'),(31,1,'CREATE','PRF',3,'System Administrator created PRF #3','2026-05-25 06:46:34.050'),(32,1,'CREATE','PRF',4,'System Administrator created PRF #4','2026-05-25 06:46:37.238'),(33,1,'CREATE','RFP',5,'System Administrator created RFP #5','2026-05-25 06:46:39.390'),(34,1,'UPDATE','RFP',5,'System Administrator updated RFP status to Cancelled','2026-05-25 06:46:43.324'),(35,4,'UPDATE','TRIP_TICKET',3,'guard updated Trip Ticket guard log','2026-05-25 06:50:47.384'),(36,1,'CREATE','PRF',5,'System Administrator created PRF #5','2026-05-25 06:54:38.119'),(37,1,'APPROVE','PRF',2,'System Administrator approved PRF','2026-05-25 06:54:44.461'),(38,1,'UPDATE','PRF',3,'System Administrator updated PRF status to Pending Approval','2026-05-25 06:54:50.517'),(39,1,'UPDATE','PRF',5,'System Administrator updated PRF status to Pending Approval','2026-05-25 06:55:17.682'),(40,1,'APPROVE','PRF',5,'System Administrator approved PRF','2026-05-25 06:55:21.047'),(41,1,'UPDATE','PRF',4,'System Administrator updated PRF status to Pending Approval','2026-05-25 06:55:25.328'),(42,1,'APPROVE','PRF',4,'System Administrator approved PRF','2026-05-25 06:59:00.810'),(43,1,'APPROVE','PRF',3,'System Administrator approved PRF','2026-05-25 06:59:03.407'),(44,1,'ARCHIVE','PRF',5,'System Administrator archived PRF','2026-05-25 07:56:43.409'),(45,1,'ARCHIVE','PRF',4,'System Administrator archived PRF','2026-05-25 07:56:46.416'),(46,1,'CREATE','TRIP_TICKET',4,'System Administrator created Trip Ticket for System Administrator','2026-05-25 08:06:01.223'),(47,1,'CREATE','PRF',6,'System Administrator created PRF #6','2026-05-25 09:50:57.638'),(48,1,'CREATE','RFP',6,'System Administrator created RFP #6','2026-05-25 09:50:59.979'),(49,1,'CREATE','TRIP_TICKET',5,'System Administrator created Trip Ticket for System Administrator','2026-05-25 09:51:02.558'),(50,1,'CREATE','TRIP_TICKET',6,'System Administrator created Trip Ticket for System Administrator','2026-05-25 09:51:16.481'),(51,1,'CREATE','TRIP_TICKET',7,'System Administrator created Trip Ticket for System Administrator','2026-05-25 09:51:18.276'),(52,1,'CREATE','TRIP_TICKET',8,'System Administrator created Trip Ticket for System Administrator','2026-05-25 09:51:20.996'),(53,1,'CREATE','TRIP_TICKET',9,'System Administrator created Trip Ticket for System Administrator','2026-05-25 09:51:22.705'),(54,1,'CREATE','PRF',7,'System Administrator created PRF #7','2026-05-26 00:16:05.945'),(55,1,'CREATE','RFP',7,'System Administrator created RFP #7','2026-05-26 00:16:08.648'),(56,4,'UPDATE','TRIP_TICKET',2,'guard updated Trip Ticket guard log','2026-05-26 00:19:39.749'),(57,4,'UPDATE','TRIP_TICKET',1,'guard updated Trip Ticket guard log','2026-05-26 00:19:59.348'),(58,4,'UPDATE','TRIP_TICKET',3,'guard updated Trip Ticket guard log','2026-05-26 00:20:23.072'),(59,1,'UPDATE','DRIVER',5,'System Administrator updated driver status for Driver2 to Inactive','2026-05-26 00:26:52.697'),(60,1,'UPDATE','DRIVER',5,'System Administrator updated driver status for Driver2 to Active','2026-05-26 00:40:43.757'),(61,1,'UPDATE','DRIVER',5,'System Administrator updated driver status for Driver2 to Inactive','2026-05-26 00:40:48.686'),(62,1,'CREATE','PRF',8,'System Administrator created PRF #8','2026-05-26 00:51:01.822'),(63,1,'CREATE','RFP',8,'System Administrator created RFP #8','2026-05-26 00:51:04.166'),(64,1,'CREATE','TRIP_TICKET',10,'System Administrator created Trip Ticket for System Administrator','2026-05-26 00:51:11.511'),(65,1,'UPDATE','RFP',6,'System Administrator updated RFP status to Pending Final Approval','2026-05-26 01:00:07.156'),(66,1,'APPROVE','RFP',6,'System Administrator approved RFP','2026-05-26 01:00:28.384'),(67,2,'APPROVE','RFP',6,'accounting approved RFP','2026-05-26 01:01:23.221'),(68,1,'CREATE','RFP',9,'System Administrator created RFP #9','2026-05-26 01:02:25.805'),(69,1,'UPDATE','RFP',9,'System Administrator updated RFP status to Pending Final Approval','2026-05-26 01:02:32.395'),(70,1,'APPROVE','RFP',9,'System Administrator approved RFP','2026-05-26 01:02:35.931'),(71,2,'APPROVE','RFP',9,'accounting approved RFP','2026-05-26 01:02:47.775'),(72,2,'UPDATE','DRIVER',5,'accounting updated driver status for Driver2 to Active','2026-05-26 01:18:07.508'),(73,2,'UPDATE','DRIVER',5,'accounting updated driver status for Driver2 to Inactive','2026-05-26 01:18:10.472'),(74,3,'UPDATE','DRIVER',3,'driver updated driver status for driver to Inactive','2026-05-26 01:42:49.555'),(75,1,'UPDATE','DRIVER',3,'System Administrator updated driver status for driver to Active','2026-05-26 01:42:51.883'),(76,3,'CREATE','TRIP_TICKET',11,'driver created Trip Ticket for driver','2026-05-26 01:43:22.738'),(77,1,'CREATE','TRIP_TICKET',12,'System Administrator created Trip Ticket for System Administrator','2026-05-26 01:47:18.980'),(78,1,'UPDATE','PRF',8,'System Administrator updated PRF status to Pending Approval','2026-05-26 02:14:29.867'),(79,1,'UPDATE','RFP',8,'System Administrator updated RFP #8 status to Disapproved','2026-05-26 06:48:04.240'),(80,1,'UPDATE','RFP',7,'System Administrator updated RFP #7 status to Disapproved','2026-05-26 06:48:31.429'),(81,1,'UPDATE','TRIP_TICKET',12,'System Administrator updated Trip Ticket #12 status to Cancelled','2026-05-26 06:48:51.541'),(82,1,'CREATE','TRIP_TICKET',13,'System Administrator created a Trip Ticket (Form #13)','2026-05-26 06:51:08.053'),(83,1,'CREATE','TRIP_TICKET',14,'System Administrator created a Trip Ticket (Form #14)','2026-05-26 06:51:27.049'),(84,1,'CREATE','TRIP_TICKET',15,'System Administrator created a Trip Ticket (Form #15)','2026-05-26 06:51:39.227'),(85,1,'UPDATE','TRIP_TICKET',15,'System Administrator updated Trip Ticket #15 status to Pending Approval','2026-05-26 06:51:53.161'),(86,1,'APPROVE','TRIP_TICKET',15,'System Administrator approved Trip Ticket #15','2026-05-26 06:51:55.826'),(87,1,'CREATE','PRF',9,'System Administrator created a PRF (Form #9)','2026-05-26 08:00:58.821'),(88,1,'CREATE','TRIP_TICKET',16,'System Administrator created a Trip Ticket (Form #16)','2026-06-01 00:29:46.336'),(89,1,'CREATE','PRF',10,'System Administrator created a PRF (Form #10)','2026-06-01 00:29:49.110'),(90,1,'CREATE','RFP',10,'System Administrator created an RFP (Form #10)','2026-06-01 00:29:52.083'),(91,7,'CREATE','PRF',11,'user created a PRF (Form #11)','2026-06-01 01:11:02.959'),(92,7,'UPDATE','PRF',11,'user updated PRF #11 status to Cancelled','2026-06-01 01:14:39.820'),(93,7,'CREATE','PRF',12,'user created a PRF (Form #12)','2026-06-01 01:14:45.288'),(94,7,'CREATE','TRIP_TICKET',17,'user created a Trip Ticket (Form #17)','2026-06-01 01:15:27.313'),(95,1,'UPDATE','PRF',12,'System Administrator updated PRF #12 status to Pending Approval','2026-06-01 01:16:10.542'),(96,1,'UPDATE','TRIP_TICKET',17,'System Administrator updated Trip Ticket #17 status to Disapproved','2026-06-01 01:16:27.343'),(97,7,'CREATE','PRF',13,'user created a PRF (Form #13)','2026-06-01 01:16:30.958'),(98,1,'UPDATE','PRF',13,'System Administrator updated PRF #13 status to Disapproved','2026-06-01 01:18:36.542'),(99,1,'CREATE','PRF',14,'System Administrator created a PRF (Form #14)','2026-06-01 01:35:59.020');
/*!40000 ALTER TABLE `activitylog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driver`
--

DROP TABLE IF EXISTS `driver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `driver` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driver`
--

LOCK TABLES `driver` WRITE;
/*!40000 ALTER TABLE `driver` DISABLE KEYS */;
/*!40000 ALTER TABLE `driver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INFO',
  `link` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT '0',
  `targetRole` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetUserId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notification_targetUserId_idx` (`targetUserId`),
  CONSTRAINT `notification_targetUserId_fkey` FOREIGN KEY (`targetUserId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (1,'accounting submitted a new PRF #2','NEW_PRF','/forms/prf',1,'PRF_Approver',NULL,'2026-05-25 05:40:24.067'),(2,'System Administrator submitted a new PRF #3','NEW_PRF','/forms/prf',1,'PRF_Approver',NULL,'2026-05-25 06:46:34.060'),(3,'System Administrator submitted a new PRF #4','NEW_PRF','/forms/prf',1,'PRF_Approver',NULL,'2026-05-25 06:46:37.246'),(4,'System Administrator submitted a new RFP #5','NEW_RFP','/forms/rfp',1,'RFP_Approver',NULL,'2026-05-25 06:46:39.398'),(5,'System Administrator submitted a new PRF #5','NEW_PRF','/forms/prf',1,'PRF_Approver',NULL,'2026-05-25 06:54:38.128'),(6,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',1,'TripTicket_Approver',NULL,'2026-05-25 08:06:01.241'),(7,'System Administrator submitted a new PRF #6','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-05-25 09:50:57.655'),(8,'System Administrator submitted a new RFP #6','NEW_RFP','/forms/rfp',0,'RFP_Approver',NULL,'2026-05-25 09:50:59.998'),(9,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-25 09:51:02.580'),(10,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-25 09:51:16.502'),(11,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-25 09:51:18.294'),(12,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-25 09:51:21.013'),(13,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-25 09:51:22.722'),(14,'System Administrator submitted a new PRF #7','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-05-26 00:16:05.968'),(15,'System Administrator submitted a new RFP #7','NEW_RFP','/forms/rfp',0,'RFP_Approver',NULL,'2026-05-26 00:16:08.665'),(16,'System Administrator submitted a new PRF #8','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-05-26 00:51:01.838'),(17,'System Administrator submitted a new RFP #8','NEW_RFP','/forms/rfp',0,'RFP_Approver',NULL,'2026-05-26 00:51:04.186'),(18,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 00:51:11.530'),(19,'RFP #6 pending Final Approval','INFO','/pending',0,'RFP_Approver',NULL,'2026-05-26 01:00:07.141'),(20,'Your RFP #6 has been Approved','APPROVED','/history',0,NULL,1,'2026-05-26 01:00:28.369'),(21,'Your RFP #6 has been Approved','APPROVED','/history',0,NULL,1,'2026-05-26 01:01:23.192'),(22,'System Administrator submitted a new RFP #9','NEW_RFP','/forms/rfp',0,'RFP_Approver',NULL,'2026-05-26 01:02:25.822'),(23,'RFP #9 pending Final Approval','INFO','/pending',0,'RFP_Approver',NULL,'2026-05-26 01:02:32.385'),(24,'Your RFP #9 has been Approved','APPROVED','/history',0,NULL,1,'2026-05-26 01:02:35.918'),(25,'Your RFP #9 has been Approved','APPROVED','/history',0,NULL,1,'2026-05-26 01:02:47.765'),(26,'driver submitted a new Trip Ticket for driver','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 01:43:22.757'),(27,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 01:47:19.001'),(28,'PRF #8 verified and pending your approval','INFO','/pending',0,'PRF_Approver',NULL,'2026-05-26 02:14:29.855'),(29,'IT submitted a new Support Ticket: yes','NEW_SUPPORT','/support',0,'IT',NULL,'2026-05-26 02:43:35.809'),(30,'System Administrator submitted a new Support Ticket: aaa','NEW_SUPPORT','/support',0,'IT',NULL,'2026-05-26 04:54:15.759'),(31,'accounting submitted a new Support Ticket: czxc','NEW_SUPPORT','/support',0,'IT',NULL,'2026-05-26 05:31:00.739'),(32,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 06:51:08.069'),(33,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 06:51:27.079'),(34,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-05-26 06:51:39.253'),(35,'Trip Ticket endorsed and pending your approval','INFO','/pending',0,'TripTicket_Approver',NULL,'2026-05-26 06:51:53.144'),(36,'Your Trip Ticket has been Approved by System Administrator','APPROVED','/history',0,NULL,1,'2026-05-26 06:51:55.807'),(37,'System Administrator submitted a new PRF #9','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-05-26 08:00:58.834'),(38,'System Administrator submitted a new Trip Ticket for System Administrator','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-06-01 00:29:46.357'),(39,'System Administrator submitted a new PRF #10','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-06-01 00:29:49.128'),(40,'System Administrator submitted a new RFP #10','NEW_RFP','/forms/rfp',0,'RFP_Approver',NULL,'2026-06-01 00:29:52.099'),(41,'user submitted a new PRF #11','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-06-01 01:11:02.970'),(42,'user submitted a new PRF #12','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-06-01 01:14:45.299'),(43,'user submitted a new Trip Ticket for user','NEW_TRIPTICKET','/forms/tripticket',0,'TripTicket_Approver',NULL,'2026-06-01 01:15:27.324'),(44,'PRF #12 verified and pending your approval','INFO','/pending',0,'PRF_Approver',NULL,'2026-06-01 01:16:10.529'),(45,'user submitted a new PRF #13','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-06-01 01:16:30.967'),(46,'System Administrator submitted a new PRF #14','NEW_PRF','/forms/prf',0,'PRF_Approver',NULL,'2026-06-01 01:35:59.039');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prf`
--

DROP TABLE IF EXISTS `prf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `prfNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateRequested` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateNeeded` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quotationSummary` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preparedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verifiedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `layout` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `authorId` int DEFAULT NULL,
  `requestor` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archivedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disapprovalReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Prf_authorId_fkey` (`authorId`),
  CONSTRAINT `Prf_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prf`
--

LOCK TABLES `prf` WRITE;
/*!40000 ALTER TABLE `prf` DISABLE KEYS */;
INSERT INTO `prf` VALUES (1,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator',NULL,'System Administrator','2026-05-25 01:12:57.873','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Approved',1,'System Administrator',NULL,NULL,NULL,NULL),(2,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'accounting','System Administrator',NULL,'System Administrator','2026-05-25 05:40:24.038','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"accounting\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"accounting\",\"items\":[]}','Approved',2,'accounting',NULL,NULL,NULL,NULL),(3,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator',NULL,'System Administrator','2026-05-25 06:46:34.032','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Approved',1,'System Administrator',NULL,NULL,NULL,NULL),(4,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator',NULL,'System Administrator','2026-05-25 06:46:37.208','{\"status\":\"Archived\",\"archivedBy\":\"System Administrator\"}','Archived',1,'System Administrator',NULL,NULL,'System Administrator',NULL),(5,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator',NULL,'System Administrator','2026-05-25 06:54:38.103','{\"status\":\"Archived\",\"archivedBy\":\"System Administrator\"}','Archived',1,'System Administrator',NULL,NULL,'System Administrator',NULL),(6,NULL,'2026-05-25',NULL,NULL,NULL,NULL,NULL,'System Administrator',NULL,NULL,NULL,'2026-05-25 09:50:57.610','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Verification',1,'System Administrator',NULL,NULL,NULL,NULL),(7,NULL,'2026-05-26',NULL,NULL,NULL,NULL,NULL,'System Administrator',NULL,NULL,NULL,'2026-05-26 00:16:05.917','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-26\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Verification',1,'System Administrator',NULL,NULL,NULL,NULL),(8,NULL,'2026-05-26',NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator',NULL,NULL,'2026-05-26 00:51:01.804','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-26\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Approval',1,'System Administrator',NULL,NULL,NULL,NULL),(9,NULL,'2026-05-26',NULL,NULL,NULL,NULL,NULL,'System Administrator',NULL,NULL,NULL,'2026-05-26 08:00:58.796','{\"prfNo\":\"\",\"dateRequested\":\"2026-05-26\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Verification',1,'System Administrator',NULL,NULL,NULL,NULL),(10,NULL,'2026-06-01',NULL,NULL,NULL,NULL,NULL,'System Administrator',NULL,NULL,NULL,'2026-06-01 00:29:49.094','{\"prfNo\":\"\",\"dateRequested\":\"2026-06-01\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Verification',1,'System Administrator',NULL,NULL,NULL,NULL),(11,NULL,'2026-06-01',NULL,NULL,NULL,NULL,NULL,'user',NULL,NULL,NULL,'2026-06-01 01:11:02.946','{\"status\":\"Cancelled\"}','Cancelled',7,'user',NULL,NULL,NULL,NULL),(12,NULL,'2026-06-01',NULL,NULL,NULL,NULL,NULL,'user','System Administrator',NULL,NULL,'2026-06-01 01:14:45.278','{\"prfNo\":\"\",\"dateRequested\":\"2026-06-01\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"Adventures\",\"remarks\":\"\",\"preparedBy\":\"user\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"user\",\"items\":[]}','Pending Approval',7,'user',NULL,'Adventures',NULL,NULL),(13,NULL,'2026-06-01',NULL,NULL,NULL,NULL,NULL,'user',NULL,NULL,NULL,'2026-06-01 01:16:30.948','{\"prfNo\":\"\",\"dateRequested\":\"2026-06-01\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"Capital Growth\",\"remarks\":\"\",\"preparedBy\":\"user\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"user\",\"items\":[]}','Disapproved',7,'user',NULL,'Capital Growth',NULL,'ty'),(14,NULL,'2026-06-01',NULL,NULL,NULL,NULL,NULL,'System Administrator',NULL,NULL,NULL,'2026-06-01 01:35:58.998','{\"prfNo\":\"\",\"dateRequested\":\"2026-06-01\",\"dateNeeded\":\"\",\"to\":\"\",\"from\":\"\",\"department\":\"\",\"company\":\"\",\"remarks\":\"\",\"preparedBy\":\"System Administrator\",\"verifiedBy\":\"\",\"approvedBy\":\"\",\"status\":\"Pending Verification\",\"requestor\":\"System Administrator\",\"items\":[]}','Pending Verification',1,'System Administrator',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `prf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prfitem`
--

DROP TABLE IF EXISTS `prfitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prfitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `qty` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `particulars` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimatedCost` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `availableStocks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prfId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PrfItem_prfId_fkey` (`prfId`),
  CONSTRAINT `PrfItem_prfId_fkey` FOREIGN KEY (`prfId`) REFERENCES `prf` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prfitem`
--

LOCK TABLES `prfitem` WRITE;
/*!40000 ALTER TABLE `prfitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `prfitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminder`
--

DROP TABLE IF EXISTS `reminder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `date` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Reminder_userId_fkey` (`userId`),
  CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminder`
--

LOCK TABLES `reminder` WRITE;
/*!40000 ALTER TABLE `reminder` DISABLE KEYS */;
/*!40000 ALTER TABLE `reminder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rrf`
--

DROP TABLE IF EXISTS `rrf`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rrf` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rrfNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestor` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateRequested` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateNeeded` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remarks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preparedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verifiedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `layout` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `authorId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `archivedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receivedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receivedDate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disapprovalReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Rrf_authorId_fkey` (`authorId`),
  CONSTRAINT `Rrf_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rrf`
--

LOCK TABLES `rrf` WRITE;
/*!40000 ALTER TABLE `rrf` DISABLE KEYS */;
INSERT INTO `rrf` VALUES (1,NULL,'System Administrator','2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'System Administrator','{\"rfpNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":\"\",\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":\"\",\"receivedDate\":\"\",\"prfNo\":\"\",\"status\":\"Pending Dept Head Approval\",\"requestor\":\"System Administrator\",\"approvedBy\":\"\",\"deptHead\":\"\",\"disapprovalReason\":\"\"}','Approved',1,'2026-05-25 01:13:00.248',NULL,'accounting','2026-05-25',NULL),(2,NULL,'System Administrator','2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'System Administrator','{\"rfpNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":null,\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":null,\"receivedDate\":null,\"prfNo\":\"\",\"status\":\"Approved\",\"requestor\":\"System Administrator\",\"approvedBy\":\"System Administrator\",\"deptHead\":\"\",\"disapprovalReason\":null,\"id\":2,\"rrfNo\":null,\"to\":null,\"from\":null,\"department\":null,\"company\":null,\"remarks\":null,\"authorId\":1,\"createdAt\":\"2026-05-25T01:14:37.744Z\",\"archivedBy\":null,\"items\":[]}','Approved',1,'2026-05-25 01:14:37.744',NULL,'accounting','2026-05-25',NULL),(3,'1231','System Administrator','2026-05-25',NULL,NULL,NULL,'dasd',NULL,NULL,NULL,'System Administrator','System Administrator','{\"rfpNo\":\"1231\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":null,\"chargeTo\":\"dasd\",\"releaseFundsTo\":\"\",\"amount\":\"1231\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":null,\"receivedDate\":null,\"prfNo\":\"\",\"status\":\"Approved\",\"requestor\":\"System Administrator\",\"approvedBy\":\"System Administrator\",\"deptHead\":\"System Administrator\",\"disapprovalReason\":null,\"id\":3,\"rrfNo\":\"1231\",\"to\":null,\"from\":null,\"department\":\"dasd\",\"company\":null,\"remarks\":null,\"verifiedBy\":\"System Administrator\",\"authorId\":1,\"createdAt\":\"2026-05-25T01:16:58.761Z\",\"archivedBy\":null,\"items\":[]}','Approved',1,'2026-05-25 01:16:58.761',NULL,'accounting','2026-05-25',NULL),(4,NULL,'System Administrator','2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator','{\"rfpNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":null,\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":null,\"receivedDate\":null,\"prfNo\":\"\",\"status\":\"Approved\",\"requestor\":\"System Administrator\",\"approvedBy\":\"System Administrator\",\"deptHead\":\"System Administrator\",\"disapprovalReason\":null,\"id\":4,\"rrfNo\":null,\"to\":null,\"from\":null,\"department\":null,\"company\":null,\"remarks\":null,\"verifiedBy\":\"System Administrator\",\"authorId\":1,\"createdAt\":\"2026-05-25T03:11:52.407Z\",\"archivedBy\":null,\"items\":[]}','Approved',1,'2026-05-25 03:11:52.407',NULL,'accounting','2026-05-25',NULL),(5,NULL,'System Administrator','2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"status\":\"Cancelled\"}','Cancelled',1,'2026-05-25 06:46:39.380',NULL,NULL,NULL,NULL),(6,NULL,'System Administrator','2026-05-25',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator','{\"rfpNo\":\"\",\"dateRequested\":\"2026-05-25\",\"dateNeeded\":null,\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":null,\"receivedDate\":null,\"prfNo\":\"\",\"status\":\"Approved\",\"requestor\":\"System Administrator\",\"approvedBy\":\"System Administrator\",\"deptHead\":\"System Administrator\",\"disapprovalReason\":null,\"id\":6,\"rrfNo\":null,\"to\":null,\"from\":null,\"department\":null,\"company\":null,\"remarks\":null,\"verifiedBy\":\"System Administrator\",\"authorId\":1,\"createdAt\":\"2026-05-25T09:50:59.954Z\",\"archivedBy\":null,\"items\":[]}','Approved',1,'2026-05-25 09:50:59.954',NULL,'accounting','2026-05-26',NULL),(7,NULL,'System Administrator','2026-05-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"status\":\"Disapproved\",\"disapprovalReason\":\"asdasdasdawcevqwevqwveqwveqw\"}','Disapproved',1,'2026-05-26 00:16:08.632',NULL,NULL,NULL,'asdasdasdawcevqwevqwveqwveqw'),(8,NULL,'System Administrator','2026-05-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"status\":\"Disapproved\",\"disapprovalReason\":\"yes\\n\"}','Disapproved',1,'2026-05-26 00:51:04.149',NULL,NULL,NULL,'yes\n'),(9,NULL,'System Administrator','2026-05-26',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'System Administrator','System Administrator','{\"rfpNo\":\"\",\"dateRequested\":\"2026-05-26\",\"dateNeeded\":null,\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":null,\"receivedDate\":null,\"prfNo\":\"\",\"status\":\"Approved\",\"requestor\":\"System Administrator\",\"approvedBy\":\"System Administrator\",\"deptHead\":\"System Administrator\",\"disapprovalReason\":null,\"id\":9,\"rrfNo\":null,\"to\":null,\"from\":null,\"department\":null,\"company\":null,\"remarks\":null,\"verifiedBy\":\"System Administrator\",\"authorId\":1,\"createdAt\":\"2026-05-26T01:02:25.790Z\",\"archivedBy\":null,\"items\":[]}','Approved',1,'2026-05-26 01:02:25.790',NULL,'accounting','2026-05-26',NULL),(10,NULL,'System Administrator','2026-06-01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'{\"rfpNo\":\"\",\"dateRequested\":\"2026-06-01\",\"dateNeeded\":\"\",\"chargeTo\":\"\",\"releaseFundsTo\":\"\",\"amount\":\"\",\"purpose\":\"\",\"poNumber\":\"\",\"siNumber\":\"\",\"receivedBy\":\"\",\"receivedDate\":\"\",\"prfNo\":\"\",\"status\":\"Pending Dept Head Approval\",\"requestor\":\"System Administrator\",\"approvedBy\":\"\",\"deptHead\":\"\",\"disapprovalReason\":\"\"}','Pending Dept Head Approval',1,'2026-06-01 00:29:52.067',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `rrf` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rrfitem`
--

DROP TABLE IF EXISTS `rrfitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rrfitem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `qty` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `particulars` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estimatedCost` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `availableStocks` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rrfId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `RrfItem_rrfId_fkey` (`rrfId`),
  CONSTRAINT `RrfItem_rrfId_fkey` FOREIGN KEY (`rrfId`) REFERENCES `rrf` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rrfitem`
--

LOCK TABLES `rrfitem` WRITE;
/*!40000 ALTER TABLE `rrfitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `rrfitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportmessage`
--

DROP TABLE IF EXISTS `supportmessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportmessage` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticketId` int NOT NULL,
  `senderId` int NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `supportmessage_ticketId_fkey` (`ticketId`),
  KEY `supportmessage_senderId_fkey` (`senderId`),
  CONSTRAINT `supportmessage_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supportmessage_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `supportticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportmessage`
--

LOCK TABLES `supportmessage` WRITE;
/*!40000 ALTER TABLE `supportmessage` DISABLE KEYS */;
INSERT INTO `supportmessage` VALUES (19,5,1,'dasd','2026-05-26 05:31:09.353'),(20,5,2,'ddd','2026-05-26 05:31:15.981'),(21,5,1,'burat','2026-05-26 05:39:00.246');
/*!40000 ALTER TABLE `supportmessage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportticket`
--

DROP TABLE IF EXISTS `supportticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportticket` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `priority` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Medium',
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Others',
  `authorId` int NOT NULL,
  `assignedToId` int DEFAULT NULL,
  `resolvedById` int DEFAULT NULL,
  `resolutionNotes` text COLLATE utf8mb4_unicode_ci,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `supportticket_authorId_fkey` (`authorId`),
  KEY `supportticket_assignedToId_fkey` (`assignedToId`),
  KEY `supportticket_resolvedById_fkey` (`resolvedById`),
  CONSTRAINT `supportticket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `supportticket_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `supportticket_resolvedById_fkey` FOREIGN KEY (`resolvedById`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportticket`
--

LOCK TABLES `supportticket` WRITE;
/*!40000 ALTER TABLE `supportticket` DISABLE KEYS */;
INSERT INTO `supportticket` VALUES (3,'yes','asd','Pending','High','Network',6,NULL,NULL,NULL,NULL,'2026-05-26 02:43:35.792','2026-05-26 02:43:35.792'),(5,'czxc','ddd','In Progress','High','Software',2,NULL,NULL,NULL,NULL,'2026-05-26 05:31:00.727','2026-05-26 05:31:04.828');
/*!40000 ALTER TABLE `supportticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `task`
--

DROP TABLE IF EXISTS `task`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `userId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Task_userId_fkey` (`userId`),
  CONSTRAINT `Task_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `task`
--

LOCK TABLES `task` WRITE;
/*!40000 ALTER TABLE `task` DISABLE KEYS */;
/*!40000 ALTER TABLE `task` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tripticket`
--

DROP TABLE IF EXISTS `tripticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tripticket` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dateRequested` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestorName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subsidiary` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `driver` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `plateNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etdOffice` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etaDestination` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateTimeDeparture` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateTimeReturn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passengersDetail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `purpose` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `medium` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requestedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `endorsedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `layout` longtext COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pending',
  `authorId` int DEFAULT NULL,
  `guardIn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `guardOut` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kmIn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `kmOut` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hdiPassengers` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outsidePassengers` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `passengerCount` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archivedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disapprovalReason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `TripTicket_authorId_fkey` (`authorId`),
  CONSTRAINT `TripTicket_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tripticket`
--

LOCK TABLES `tripticket` WRITE;
/*!40000 ALTER TABLE `tripticket` DISABLE KEYS */;
INSERT INTO `tripticket` VALUES (1,'2026-05-25','System Administrator','','','','','','','2026-05-26T08:19',NULL,'','','','','System Administrator','System Administrator','System Administrator','2026-05-25 01:11:18.969',NULL,'DEPARTED',1,NULL,'guard',NULL,'333','','','',NULL,NULL),(2,'2026-05-25','System Administrator','','','','','','','2026-05-26T08:19',NULL,'','','','','System Administrator','System Administrator','System Administrator','2026-05-25 05:20:39.553',NULL,'DEPARTED',1,NULL,'guard',NULL,'1222','','','',NULL,NULL),(3,'2026-05-25','accounting','','','','','','','2026-05-25T14:50','2026-05-26T08:20','','','','','accounting','System Administrator','System Administrator','2026-05-25 05:20:51.152',NULL,'ARRIVED',2,'guard','guard','124','123','','','',NULL,NULL),(4,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 08:06:01.204',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(5,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 09:51:02.535',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(6,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 09:51:16.457',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(7,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 09:51:18.261',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(8,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 09:51:20.981',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(9,'2026-05-25','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-25 09:51:22.688',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(10,'2026-05-26','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-26 00:51:11.496',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(11,'2026-05-26','driver','','','','','','',NULL,NULL,'','','','','driver','','','2026-05-26 01:43:22.724',NULL,'Pending Endorsement',3,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(12,'2026-05-26','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-05-26 01:47:18.959',NULL,'Cancelled',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(13,'2026-05-26','System Administrator','','driver','Mitsubishi Montero (Black)','ABC-5678','2026-05-26T14:51','2026-05-28T14:51',NULL,NULL,'','','','','System Administrator','','','2026-05-26 06:51:08.037',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(14,'2026-05-26','System Administrator','','driver','Toyota Hiace (White)','XYZ-9012','2026-05-26T14:51','2026-05-28T14:51',NULL,NULL,'','','','','System Administrator','','','2026-05-26 06:51:27.027',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(15,'2026-05-26','System Administrator','','driver','Toyota Hiace (White)','XYZ-9012','2026-05-26T14:51','2026-05-28T14:51',NULL,NULL,'','','','','System Administrator','System Administrator','System Administrator','2026-05-26 06:51:39.201',NULL,'Approved',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(16,'2026-06-01','System Administrator','','','','','','',NULL,NULL,'','','','','System Administrator','','','2026-06-01 00:29:46.302',NULL,'Pending Endorsement',1,NULL,NULL,NULL,NULL,'','','',NULL,NULL),(17,'2026-06-01','user','','','','','','',NULL,NULL,'','','','','user','','','2026-06-01 01:15:27.304',NULL,'Disapproved',7,NULL,NULL,NULL,NULL,'','','',NULL,'asdas');
/*!40000 ALTER TABLE `tripticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `canApprove` tinyint(1) NOT NULL DEFAULT '0',
  `canApprovePRF` tinyint(1) NOT NULL DEFAULT '0',
  `canApproveTripTicket` tinyint(1) NOT NULL DEFAULT '0',
  `canApproveRFP` tinyint(1) NOT NULL DEFAULT '0',
  `canApproveDeptHead` tinyint(1) NOT NULL DEFAULT '0',
  `canEndorse` tinyint(1) NOT NULL DEFAULT '0',
  `canVerify` tinyint(1) NOT NULL DEFAULT '0',
  `signatureUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatarUrl` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `themeColor` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '#0f172a',
  `isDarkMode` tinyint(1) NOT NULL DEFAULT '0',
  `role` enum('User','Admin','Driver','Guard','Accounting','IT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'User',
  `permissions` json DEFAULT NULL,
  `inactiveReason` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `company` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'admin','$2b$10$siXr88L6St43QGyTpeNWx.6nRE8UeGH4ZTI244L6i0efOVa.AK/fe','System Administrator','2026-05-25 01:07:13.613','2026-05-25 09:07:38.084',1,1,1,1,1,1,1,NULL,'/uploads/avatars/avatar-1779677412092-291079627.png','#6366f1',0,'Admin','{\"prf\": {\"edit\": true, \"view\": true, \"create\": true, \"delete\": true}, \"rrf\": {\"edit\": true, \"view\": true, \"create\": true, \"delete\": true}, \"users\": {\"view\": true}, \"history\": {\"view\": true}, \"support\": {\"view\": true}, \"archived\": {\"view\": true}, \"vehicles\": {\"view\": true}, \"tripTicket\": {\"edit\": true, \"view\": true, \"create\": true, \"delete\": true}}',NULL,'Active',NULL),(2,'Accounting@test.com','$2b$10$xi16V0.WPhDvuX02JfGFjec19s32S7Y9RpVGi6p51z6x7pEk2M1iO','accounting','2026-05-25 03:00:29.870','2026-05-26 06:12:12.741',0,0,0,0,0,0,0,NULL,'/uploads/avatars/avatar-1779775932733-33923696.png','#0f172a',0,'Accounting','{}',NULL,'Active',NULL),(3,'driver@test.com','$2b$10$UfWUgo.t5OkONqShGwGWw.RxzgnymqbFhVBDB9plV/P7NvLxnIxgW','driver','2026-05-25 06:00:36.581','2026-05-26 01:47:40.748',0,0,0,0,0,0,0,NULL,'/uploads/avatars/avatar-1779760060704-303648486.png','#0f172a',0,'Driver','{}',NULL,'Active',NULL),(4,'guard@test.com','$2b$10$Jffd2mqzdG4R8Sd6PmWlOOAUyWho9h12kjlRRWHgcOFrAJjADYbgu','guard','2026-05-25 06:50:17.570','2026-05-25 06:50:17.570',0,0,0,0,0,0,0,NULL,NULL,'#0f172a',0,'Guard','{}',NULL,'Active',NULL),(5,'Driver2@test.com','$2b$10$/cUKPCGmAnFNjr4bBcLTgeDT4FvP/Ode0ZJQr4G///qCwrKjxRczG','Driver2','2026-05-26 00:20:51.931','2026-05-26 01:18:10.459',0,0,0,0,0,0,0,NULL,NULL,'#0f172a',0,'Driver','{}','d','Inactive',NULL),(6,'IT@test.com','$2b$10$jfA6QM2Q.Y6dx9uQfSH3zuOeLtMlEe10q0u2yj3G7I7mo6W198fGm','IT','2026-05-26 01:47:12.491','2026-05-26 04:54:01.416',0,0,0,0,0,0,0,NULL,NULL,'#0f172a',0,'IT','{\"support\": {\"edit\": false, \"view\": false}}',NULL,'Active',NULL),(7,'user@test.com','$2b$10$ekb6YZgBSX4N6/BkIYGec.Zu4UN7/7IA1IHmh6u5QsUUR6uLkSIU6','user','2026-05-26 05:50:18.038','2026-06-01 01:14:53.221',0,0,0,0,0,0,0,NULL,NULL,'#0f172a',0,'User','{\"vehicles\": {\"view\": false, \"manage\": true}}',NULL,'Active','Capital Growth'),(8,'test_prisma@test.com','$2b$10$QCJyfTOVV.fLWVqewW/fjubU6AZdKKgsckODfnp2ISfQ8Zu3RTTDK','Test','2026-05-26 05:55:43.329','2026-05-26 05:55:43.329',0,0,0,0,0,0,0,NULL,NULL,'#0f172a',0,'User','{}',NULL,'Active',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehicle`
--

DROP TABLE IF EXISTS `vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plateNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fuelType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transmission` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `engineNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `chassisNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle`
--

LOCK TABLES `vehicle` WRITE;
/*!40000 ALTER TABLE `vehicle` DISABLE KEYS */;
INSERT INTO `vehicle` VALUES (1,'Toyota Innova (Silver)','NBT-1234','Toyota','Innova','2022','Silver','Diesel','Automatic',NULL,NULL,'Active','2026-05-26 06:36:07.967'),(2,'Mitsubishi Montero (Black)','ABC-5678','Mitsubishi','Montero Sport','2023','Black','Diesel','Automatic',NULL,NULL,'Active','2026-05-26 06:36:07.979'),(3,'Toyota Hiace (White)','XYZ-9012','Toyota','Hiace Commuter','2021','White','Diesel','Manual',NULL,NULL,'Active','2026-05-26 06:36:07.988'),(4,'Honda Civic (Red)','DEF-3456','Honda','Civic','2020','Red','Gasoline','Automatic','','','Inactive','2026-05-26 06:36:07.994'),(5,'Ford Ranger (Blue)','GHI-7890','Ford','Ranger Raptor','2024','Blue','Diesel','Automatic','','','Inactive','2026-05-26 06:36:08.003');
/*!40000 ALTER TABLE `vehicle` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-01 11:09:46
