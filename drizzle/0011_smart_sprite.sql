CREATE TABLE `section_banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionKey` varchar(64) NOT NULL,
	`imageUrl` text,
	`mobileImageUrl` text,
	`title` varchar(256),
	`subtitle` varchar(512),
	`linkUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `section_banners_id` PRIMARY KEY(`id`),
	CONSTRAINT `section_banners_sectionKey_unique` UNIQUE(`sectionKey`)
);
