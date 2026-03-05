CREATE TABLE `missions` (
	`id` int AUTO_INCREMENT NOT NULL,
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `missions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userMissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`missionId` int NOT NULL,
	`accepted` boolean NOT NULL DEFAULT false,
	`watchedSeconds` int NOT NULL DEFAULT 0,
	`completed` boolean NOT NULL DEFAULT false,
	`claimed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userMissions_id` PRIMARY KEY(`id`),
	CONSTRAINT `userMissions_userId_missionId_unique` UNIQUE(`userId`,`missionId`)
);
--> statement-breakpoint
CREATE TABLE `missionClaims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`missionId` int NOT NULL,
	`rewardRlc` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `missionClaims_id` PRIMARY KEY(`id`)
);
