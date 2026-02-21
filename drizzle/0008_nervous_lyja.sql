CREATE TABLE `verification_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` varchar(32) NOT NULL DEFAULT 'pending',
	`reason` text,
	`adminNote` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`reviewedAt` timestamp,
	`reviewedBy` int,
	CONSTRAINT `verification_requests_id` PRIMARY KEY(`id`),
	CONSTRAINT `verification_requests_userId_unique` UNIQUE(`userId`)
);
