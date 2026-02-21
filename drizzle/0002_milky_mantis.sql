CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` int NOT NULL,
	`teamId` int NOT NULL,
	`amount` int NOT NULL,
	`multiplier` decimal(5,2) NOT NULL,
	`potentialWin` int NOT NULL,
	`status` enum('pending','won','lost','cancelled','refunded') NOT NULL DEFAULT 'pending',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`logo` text,
	`banner` text,
	`genre` varchar(64),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`tournamentCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `games_id` PRIMARY KEY(`id`),
	CONSTRAINT `games_name_unique` UNIQUE(`name`),
	CONSTRAINT `games_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `news` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`slug` varchar(256) NOT NULL,
	`excerpt` text,
	`content` text NOT NULL,
	`coverImage` text,
	`category` enum('torneos','equipos','juegos','plataforma','general') NOT NULL DEFAULT 'general',
	`authorId` int NOT NULL,
	`isPublished` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`viewCount` int NOT NULL DEFAULT 0,
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `news_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `promotions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`bannerImage` text,
	`linkUrl` text,
	`linkLabel` varchar(64),
	`isActive` boolean NOT NULL DEFAULT true,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `promotions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rlc_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('deposit','withdrawal','bet_placed','bet_won','bet_lost','reward','refund') NOT NULL,
	`amount` int NOT NULL,
	`balanceAfter` int NOT NULL,
	`description` varchar(256),
	`referenceId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rlc_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int,
	`title` varchar(256) NOT NULL,
	`platform` enum('twitch','youtube','discord','other') NOT NULL,
	`url` text NOT NULL,
	`embedUrl` text,
	`isLive` boolean NOT NULL DEFAULT false,
	`viewerCount` int DEFAULT 0,
	`thumbnailUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `streams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`tournamentId` int,
	`awardedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `team_members` MODIFY COLUMN `role` enum('captain','player','substitute','coach') NOT NULL DEFAULT 'player';--> statement-breakpoint
ALTER TABLE `tournaments` MODIFY COLUMN `status` enum('draft','pending_approval','registration_open','registration_closed','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `teams` ADD `tag` varchar(8);--> statement-breakpoint
ALTER TABLE `teams` ADD `country` varchar(64);--> statement-breakpoint
ALTER TABLE `teams` ADD `wins` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `losses` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `tournamentsPlayed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `tournamentsWon` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `socialDiscord` varchar(128);--> statement-breakpoint
ALTER TABLE `teams` ADD `socialTwitch` varchar(128);--> statement-breakpoint
ALTER TABLE `teams` ADD `socialTwitter` varchar(128);--> statement-breakpoint
ALTER TABLE `teams` ADD `isVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `registrationType` enum('team','player','both') DEFAULT 'team' NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `prizeFirst` varchar(256);--> statement-breakpoint
ALTER TABLE `tournaments` ADD `prizeSecond` varchar(256);--> statement-breakpoint
ALTER TABLE `tournaments` ADD `prizeThird` varchar(256);--> statement-breakpoint
ALTER TABLE `tournaments` ADD `adminNote` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `primaryColor` varchar(32) DEFAULT '#ff0000';--> statement-breakpoint
ALTER TABLE `tournaments` ADD `secondaryColor` varchar(32) DEFAULT '#000000';--> statement-breakpoint
ALTER TABLE `tournaments` ADD `isFeatured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `streamUrl` text;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `streamPlatform` enum('twitch','youtube','discord','other');--> statement-breakpoint
ALTER TABLE `tournaments` ADD `isLive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tournaments` ADD `viewCount` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `profileType` enum('player','team_captain','event_creator') DEFAULT 'player';--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `nickname` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `mainGame` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `socialDiscord` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `socialTwitch` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `socialTwitter` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `rlcBalance` int DEFAULT 500 NOT NULL;