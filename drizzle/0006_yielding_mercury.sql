CREATE TABLE `content_creators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`category` varchar(64),
	`bio` text,
	`youtube` varchar(256),
	`twitch` varchar(256),
	`twitter` varchar(256),
	`instagram` varchar(256),
	`tiktok` varchar(256),
	`subscribers` int DEFAULT 0,
	`adminNote` text,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_creators_id` PRIMARY KEY(`id`),
	CONSTRAINT `content_creators_userId_unique` UNIQUE(`userId`)
);
