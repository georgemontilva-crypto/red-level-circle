-- Agregar gameMode a la tabla tournaments
ALTER TABLE `tournaments` ADD COLUMN `gameMode` varchar(64);

-- Ampliar el enum de bracketType para incluir swiss y round_robin
ALTER TABLE `tournaments` MODIFY COLUMN `bracketType` enum('single_elimination','double_elimination','groups','swiss','round_robin') NOT NULL;
