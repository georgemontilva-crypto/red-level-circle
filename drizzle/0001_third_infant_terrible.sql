CREATE TABLE `registration_audit_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`registrationId` int NOT NULL,
	`previousStatus` varchar(32),
	`newStatus` varchar(32) NOT NULL,
	`changedById` int NOT NULL,
	`note` text,
	`changedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `registration_audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('captain','player','substitute') NOT NULL DEFAULT 'player',
	`gameId` varchar(128),
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`logo` text,
	`banner` text,
	`captainId` int NOT NULL,
	`description` text,
	`game` varchar(64),
	`points` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`round` int NOT NULL,
	`matchNumber` int NOT NULL,
	`team1Id` int,
	`team2Id` int,
	`winnerId` int,
	`team1Score` int,
	`team2Score` int,
	`status` enum('pending','in_progress','completed') NOT NULL DEFAULT 'pending',
	`scheduledAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`bracketPosition` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_registrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tournamentId` int NOT NULL,
	`teamId` int NOT NULL,
	`status` enum('Pendiente','Aprobado','Rechazado','Cancelado') NOT NULL DEFAULT 'Pendiente',
	`creatorMessage` text,
	`teamMessage` text,
	`registeredAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_registrations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`game` varchar(64) NOT NULL,
	`description` text,
	`rules` text,
	`bracketType` enum('single_elimination','double_elimination','groups') NOT NULL,
	`maxTeams` int NOT NULL DEFAULT 16,
	`minPlayersPerTeam` int NOT NULL DEFAULT 1,
	`maxPlayersPerTeam` int NOT NULL DEFAULT 5,
	`prizeDescription` text,
	`prizeAmount` int DEFAULT 0,
	`registrationStart` timestamp,
	`registrationEnd` timestamp,
	`startDate` timestamp,
	`endDate` timestamp,
	`status` enum('draft','registration_open','registration_closed','in_progress','completed','cancelled') NOT NULL DEFAULT 'draft',
	`creatorId` int NOT NULL,
	`winnerId` int,
	`banner` text,
	`isPublic` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','premium','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;