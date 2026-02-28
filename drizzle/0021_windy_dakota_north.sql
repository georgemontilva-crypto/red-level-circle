ALTER TABLE `bets` ADD `matchId` int;--> statement-breakpoint
ALTER TABLE `tournament_matches` ADD `betsCloseAt` timestamp;