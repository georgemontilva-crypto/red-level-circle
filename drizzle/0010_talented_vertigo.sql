ALTER TABLE `reward_tasks` ADD `thumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `reward_tasks` ADD `sponsorName` varchar(128);--> statement-breakpoint
ALTER TABLE `reward_tasks` ADD `sponsorLogoUrl` text;--> statement-breakpoint
ALTER TABLE `reward_tasks` ADD `expiresAt` timestamp;