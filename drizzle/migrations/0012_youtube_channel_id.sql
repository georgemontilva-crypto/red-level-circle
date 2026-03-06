-- Migration: add youtubeChannelId to content_creators
-- Used to build the embed URL with live_stream?channel=UC... instead of a videoId
-- This avoids scraping instability where YouTube returns random videoIds each request

ALTER TABLE `content_creators`
  ADD COLUMN `youtubeChannelId` varchar(64) NULL
  AFTER `youtube`;
