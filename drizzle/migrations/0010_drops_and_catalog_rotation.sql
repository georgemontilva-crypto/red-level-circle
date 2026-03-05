-- Migration: 0010_drops_and_catalog_rotation
-- Adds drop/supply fields to cosmetics, rotation fields to catalog_items, and creates drops table

-- ─── cosmetics: supply & drop window ─────────────────────────────────────────
ALTER TABLE `cosmetics`
  ADD COLUMN `maxSupply`     INT          NULL          AFTER `isLimited`,
  ADD COLUMN `currentSupply` INT          NOT NULL DEFAULT 0 AFTER `maxSupply`,
  ADD COLUMN `dropStart`     TIMESTAMP    NULL          AFTER `currentSupply`,
  ADD COLUMN `dropEnd`       TIMESTAMP    NULL          AFTER `dropStart`;

-- ─── catalog_items: rotation & scheduling ────────────────────────────────────
ALTER TABLE `catalog_items`
  ADD COLUMN `weeklyFeatured`  TINYINT(1)   NOT NULL DEFAULT 0 AFTER `isVisible`,
  ADD COLUMN `featuredPriority` INT         NOT NULL DEFAULT 0 AFTER `weeklyFeatured`,
  ADD COLUMN `visibleFrom`     TIMESTAMP    NULL          AFTER `featuredPriority`,
  ADD COLUMN `visibleUntil`    TIMESTAMP    NULL          AFTER `visibleFrom`,
  ADD COLUMN `publishDate`     TIMESTAMP    NULL          AFTER `visibleUntil`;

-- ─── drops: scheduled launch events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `drops` (
  `id`           INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name`         VARCHAR(128) NOT NULL,
  `slug`         VARCHAR(128) NOT NULL UNIQUE,
  `description`  TEXT         NULL,
  `bannerImage`  TEXT         NULL,
  `collectionId` INT          NULL,
  `startDate`    TIMESTAMP    NOT NULL,
  `endDate`      TIMESTAMP    NOT NULL,
  `isActive`     TINYINT(1)   NOT NULL DEFAULT 0,
  `createdAt`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
