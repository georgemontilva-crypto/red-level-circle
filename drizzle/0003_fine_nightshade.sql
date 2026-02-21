CREATE TABLE `brand_ads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brandName` varchar(128) NOT NULL,
	`title` varchar(256) NOT NULL,
	`tagline` varchar(256),
	`description` text,
	`bannerImage` text NOT NULL,
	`logoImage` text,
	`accentColor` varchar(32) DEFAULT '#ff0000',
	`destinationUrl` text,
	`ctaLabel` varchar(64) DEFAULT 'Ver más',
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isPremium` boolean NOT NULL DEFAULT false,
	`clickCount` int NOT NULL DEFAULT 0,
	`impressionCount` int NOT NULL DEFAULT 0,
	`startsAt` timestamp,
	`endsAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brand_ads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cosmetics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`type` enum('frame','aura','badge','background') NOT NULL DEFAULT 'frame',
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`previewImage` text,
	`frameImage` text,
	`colors` json,
	`price` int NOT NULL,
	`originalPrice` int,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isLimited` boolean NOT NULL DEFAULT false,
	`collection` varchar(128),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cosmetics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reward_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`type` enum('video','ad','daily_login','share','follow') NOT NULL DEFAULT 'video',
	`reward` int NOT NULL,
	`contentUrl` text,
	`durationSeconds` int DEFAULT 30,
	`maxClaimsPerUser` int DEFAULT 1,
	`maxClaimsPerDay` int DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reward_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`image` text,
	`price` int NOT NULL,
	`originalPrice` int,
	`category` enum('physical','digital','bundle','limited') NOT NULL DEFAULT 'digital',
	`stock` int NOT NULL DEFAULT -1,
	`isActive` boolean NOT NULL DEFAULT true,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`isLimited` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`totalPrice` int NOT NULL,
	`status` enum('pending','processing','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`deliveryNote` text,
	`userNote` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_cosmetics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cosmeticId` int NOT NULL,
	`isEquipped` boolean NOT NULL DEFAULT false,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_cosmetics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_reward_claims_id` PRIMARY KEY(`id`)
);
