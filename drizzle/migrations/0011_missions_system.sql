-- Migration: 0011_missions_system
-- Creates missions, userMissions, and missionClaims tables

CREATE TABLE IF NOT EXISTS `missions` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `title` varchar(256) NOT NULL,
  `description` text,
  `bannerUrl` text,
  `videoUrl` text NOT NULL,
  `sponsorName` varchar(128),
  `sponsorLogo` text,
  `rewardRlc` int NOT NULL DEFAULT 0,
  `requiredWatchSeconds` int NOT NULL DEFAULT 30,
  `startDate` timestamp,
  `endDate` timestamp,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

CREATE TABLE IF NOT EXISTS `userMissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `userId` int NOT NULL,
  `missionId` int NOT NULL,
  `accepted` boolean NOT NULL DEFAULT false,
  `watchedSeconds` int NOT NULL DEFAULT 0,
  `completed` boolean NOT NULL DEFAULT false,
  `claimed` boolean NOT NULL DEFAULT false,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  UNIQUE KEY `userMissions_userId_missionId_unique` (`userId`, `missionId`)
);

CREATE TABLE IF NOT EXISTS `missionClaims` (
  `id` int AUTO_INCREMENT PRIMARY KEY NOT NULL,
  `userId` int NOT NULL,
  `missionId` int NOT NULL,
  `rewardRlc` int NOT NULL,
  `claimedAt` timestamp NOT NULL DEFAULT (now())
);
