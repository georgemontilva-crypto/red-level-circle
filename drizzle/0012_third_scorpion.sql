ALTER TABLE `brand_ads` ADD `adType` enum('featured','card','wide') DEFAULT 'card' NOT NULL;--> statement-breakpoint
ALTER TABLE `brand_ads` ADD `sortOrder` int DEFAULT 0 NOT NULL;