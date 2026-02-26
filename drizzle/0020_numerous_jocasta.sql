ALTER TABLE `streams` MODIFY COLUMN `platform` enum('twitch','youtube','discord','other') NOT NULL DEFAULT 'twitch';--> statement-breakpoint
ALTER TABLE `streams` ADD `userId` int;--> statement-breakpoint
ALTER TABLE `streams` ADD `type` enum('tournament','creator') DEFAULT 'creator' NOT NULL;--> statement-breakpoint
ALTER TABLE `streams` ADD `gameSlug` varchar(128);