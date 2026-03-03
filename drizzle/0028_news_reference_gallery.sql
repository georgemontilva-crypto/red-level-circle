-- Migration: Add referenceUrl and gallery columns to news table
ALTER TABLE `news` ADD COLUMN `referenceUrl` text;
ALTER TABLE `news` ADD COLUMN `gallery` text;
