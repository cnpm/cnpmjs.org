CREATE TABLE `user` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) NOT NULL COMMENT 'user name',
 `salt` varchar(100) NOT NULL,
 `password_sha` varchar(100) NOT NULL COMMENT 'user password hash',
 `ip` varchar(64) NOT NULL COMMENT 'user last request ip',
 `roles` varchar(200) NOT NULL DEFAULT '[]',
 `rev` varchar(40) NOT NULL,
 `email` varchar(400) NOT NULL,
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='user base info';

CREATE TABLE `module_keyword` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `keyword` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'keyword',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `description` longtext,
 PRIMARY KEY (`id`),
 UNIQUE KEY `keyword_module_name` (`keyword`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module keyword';

CREATE TABLE `module` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `author` varchar(100) NOT NULL,
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `description` longtext,
 `package` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'package.json',
 `dist_shasum` varchar(100) DEFAULT NULL,
 `dist_tarball` varchar(2048) DEFAULT NULL,
 `dist_size` int(10) unsigned NOT NULL DEFAULT '0',
 `publish_time` bigint(20) unsigned,
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`,`version`),
 KEY `gmt_modified` (`gmt_modified`),
 KEY `publish_time` (`publish_time`),
 KEY `author` (`author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module info';
-- ALTER TABLE `module` ADD `description` longtext;
-- ALTER TABLE `module` ADD `publish_time` bigint(20) unsigned, ADD KEY `publish_time` (`publish_time`);
-- ALTER TABLE `module` CHANGE `package` `package` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci;
-- ALTER TABLE `module` CHANGE `description` `description` LONGTEXT CHARACTER SET utf8 COLLATE utf8_general_ci;
-- show create table module\G
-- ALTER TABLE  `module` CHANGE  `name`  `name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';

CREATE TABLE `module_log` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `username` varchar(100) NOT NULL,
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `log` longtext,
 PRIMARY KEY (`id`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module sync log';
-- ALTER TABLE  `module_log` CHANGE  `name`  `name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';

CREATE TABLE `tag` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `tag` varchar(30) NOT NULL COMMENT 'tag name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `module_id` bigint(20) unsigned NOT NULL COMMENT 'module id',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`, `tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module tag';
-- ALTER TABLE  `tag` ADD  `module_id` BIGINT( 20 ) UNSIGNED NOT NULL;
-- ALTER TABLE  `tag` CHANGE  `name`  `name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';

CREATE TABLE `total` (
 `name` varchar(100) NOT NULL COMMENT 'total name',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `module_delete` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'module delete count',
 `last_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync from official registry',
 `last_exist_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync exist packages from official registry',
 `sync_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'system sync from official registry status',
 `need_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages need to be sync',
 `success_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync success at this time',
 `fail_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync fail at this time',
 `left_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages left to be sync',
 `last_sync_module` varchar(100) COMMENT 'last sync success module name',
 PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='total info';
INSERT INTO total(name, gmt_modified) VALUES('total', now());
-- ALTER TABLE `total` ADD `last_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync from official registry'
-- ALTER TABLE `total` ADD `last_exist_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync exist packages from official registry'
-- ALTER TABLE `total` ADD `sync_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'system sync from official registry status'
-- ALTER TABLE `total` ADD `need_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages need to be sync'
-- ALTER TABLE `total` ADD `success_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync success at this time'
-- ALTER TABLE `total` ADD `fail_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync fail at this time'
-- ALTER TABLE `total` ADD `left_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages left to be sync'
-- ALTER TABLE `total` ADD `last_sync_module` varchar(100) NOT NULL COMMENT 'last sync success module name';

CREATE TABLE `download_total` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `date` varchar(10) NOT NULL COMMENT 'YYYY-MM-DD format',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `count` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'download count',
 PRIMARY KEY (`id`),
 UNIQUE KEY `date_name` (`date`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';
-- ALTER TABLE  `download_total` CHANGE  `name`  `name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';

CREATE TABLE `module_deps` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `deps` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'which module depend on this module',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name_deps` (`name`,`deps`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module deps';
