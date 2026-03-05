-- ─── Creator Missions System ─────────────────────────────────────────────────
-- Missions created by admin targeting content creators

CREATE TABLE IF NOT EXISTS `creator_missions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `title` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `requirements` text,          -- detailed requirements (hashtags, mentions, etc.)
  `resourcesUrl` text,          -- Google Drive or external link with assets
  `platforms` varchar(512),     -- comma-separated: instagram,tiktok,youtube,twitter
  `rewardRlc` int NOT NULL DEFAULT 100,
  `bonusRlc` int NOT NULL DEFAULT 50,  -- extra RLC for top engagement at month end
  `startDate` timestamp,
  `endDate` timestamp,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdBy` int NOT NULL,     -- admin userId
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tracks which creators accepted the mission
CREATE TABLE IF NOT EXISTS `creator_mission_accepts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `missionId` int NOT NULL,
  `userId` int NOT NULL,
  `acceptedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_accept` (`missionId`, `userId`)
);

-- Submissions: links uploaded by creators after completing the mission
CREATE TABLE IF NOT EXISTS `creator_mission_submissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `missionId` int NOT NULL,
  `userId` int NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `adminNote` text,
  `rewardPaid` boolean NOT NULL DEFAULT false,
  `submittedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewedAt` timestamp,
  `reviewedBy` int,
  UNIQUE KEY `unique_submission` (`missionId`, `userId`)
);

-- Individual links within a submission (one submission can have many links)
CREATE TABLE IF NOT EXISTS `creator_mission_links` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `submissionId` int NOT NULL,
  `url` text NOT NULL,
  `platform` varchar(64),       -- instagram, tiktok, youtube, etc.
  `addedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
