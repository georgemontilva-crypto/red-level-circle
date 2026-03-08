-- Migration: 0033_roles_system
-- Adds role system: new role enum values, canCreateTournaments, orgName/orgDescription,
-- role_requests table, and tournament_collaborators table.

-- 1. Modify users.role enum to new values
--    Old: user | premium | organizer | admin | super_admin
--    New: player | to | cdc | partner | admin | super_admin
--    Strategy: rename existing values first, then alter enum
ALTER TABLE `users`
  MODIFY COLUMN `role` ENUM('player','to','cdc','partner','admin','super_admin') NOT NULL DEFAULT 'player';

-- Migrate existing data: map old values to new
UPDATE `users` SET `role` = 'player' WHERE `role` NOT IN ('player','to','cdc','partner','admin','super_admin');

-- 2. Add new columns to users
ALTER TABLE `users`
  ADD COLUMN IF NOT EXISTS `canCreateTournaments` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS `orgName` VARCHAR(128) NULL,
  ADD COLUMN IF NOT EXISTS `orgDescription` TEXT NULL;

-- 3. Create role_requests table
CREATE TABLE IF NOT EXISTS `role_requests` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `requestedRole` ENUM('to','cdc','partner') NOT NULL,
  `orgName` VARCHAR(128) NOT NULL,
  `orgDescription` TEXT NULL,
  `experience` TEXT NULL,
  `discordContact` VARCHAR(128) NULL,
  `websiteUrl` VARCHAR(256) NULL,
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewedBy` INT NULL,
  `reviewNote` TEXT NULL,
  `reviewedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `rr_user_idx` (`userId`)
);

-- 4. Create tournament_collaborators table
CREATE TABLE IF NOT EXISTS `tournament_collaborators` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tournamentId` INT NOT NULL,
  `userId` INT NOT NULL,
  `addedBy` INT NOT NULL,
  `addedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `tc_tournament_idx` (`tournamentId`),
  INDEX `tc_user_idx` (`userId`),
  UNIQUE KEY `tc_unique` (`tournamentId`, `userId`)
);
