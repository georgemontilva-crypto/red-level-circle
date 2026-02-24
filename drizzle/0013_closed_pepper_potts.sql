CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('bracket_ready','mission_approved','mission_rejected','order_confirmed','team_invite','team_invite_accepted','team_invite_rejected','creator_verified','creator_rejected','tournament_full','match_scheduled','match_result','coins_earned','coins_spent','general') NOT NULL,
	`title` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`link` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`referenceId` int,
	`referenceType` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
