CREATE TABLE IF NOT EXISTS `user` (
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
 `json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'json details',
 `npm_user` tinyint(1) DEFAULT '0' COMMENT 'user sync from npm or not, 1: true, other: false',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='user base info';
-- ALTER TABLE `user`
--   ADD `json` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'json details',
--   ADD `npm_user` tinyint(1) DEFAULT '0' COMMENT 'user sync from npm or not, 1: true, other: false';
-- ALTER TABLE `user` CHANGE `json` `json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'json details';

CREATE TABLE IF NOT EXISTS `module_keyword` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `keyword` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'keyword',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `description` longtext,
 PRIMARY KEY (`id`),
 UNIQUE KEY `keyword_module_name` (`keyword`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module keyword';

CREATE TABLE IF NOT EXISTS `module_star` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'user name',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 PRIMARY KEY (`id`),
 UNIQUE KEY `user_module_name` (`user`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module star';

CREATE TABLE IF NOT EXISTS `module_maintainer` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'user name',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 PRIMARY KEY (`id`),
 UNIQUE KEY `user_module_name` (`user`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='private module maintainers';

CREATE TABLE IF NOT EXISTS `npm_module_maintainer` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'user name',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 PRIMARY KEY (`id`),
 UNIQUE KEY `user_module_name` (`user`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='npm original module maintainers';

CREATE TABLE IF NOT EXISTS `module` (
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

CREATE TABLE IF NOT EXISTS `module_abbreviated` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `package` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'the abbreviated metadata',
 `publish_time` bigint(20) unsigned,
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`,`version`),
 KEY `gmt_modified` (`gmt_modified`),
 KEY `publish_time` (`publish_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module abbreviated info';

CREATE TABLE IF NOT EXISTS `package_readme` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `readme` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'the latest version readme',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='package latest readme';

CREATE TABLE IF NOT EXISTS `module_log` (
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

CREATE TABLE IF NOT EXISTS `tag` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `tag` varchar(30) NOT NULL COMMENT 'tag name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `module_id` bigint(20) unsigned NOT NULL COMMENT 'module id',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`, `tag`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module tag';
-- ALTER TABLE  `tag` ADD  `module_id` BIGINT( 20 ) UNSIGNED NOT NULL;
-- ALTER TABLE  `tag` CHANGE  `name`  `name` VARCHAR( 100 ) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';
-- ALTER TABLE `tag` ADD KEY `gmt_modified` (`gmt_modified`);

CREATE TABLE IF NOT EXISTS `module_unpublished` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `package` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'base info: tags, time, maintainers, description, versions',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module unpublished info';

CREATE TABLE IF NOT EXISTS `total` (
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
-- init `total` count
INSERT INTO total(name, gmt_modified) VALUES('total', now())
  ON DUPLICATE KEY UPDATE gmt_modified=now();
-- ALTER TABLE `total` ADD `last_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync from official registry'
-- ALTER TABLE `total` ADD `last_exist_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync exist packages from official registry'
-- ALTER TABLE `total` ADD `sync_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'system sync from official registry status'
-- ALTER TABLE `total` ADD `need_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages need to be sync'
-- ALTER TABLE `total` ADD `success_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync success at this time'
-- ALTER TABLE `total` ADD `fail_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync fail at this time'
-- ALTER TABLE `total` ADD `left_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages left to be sync'
-- ALTER TABLE `total` ADD `last_sync_module` varchar(100) NOT NULL COMMENT 'last sync success module name';

-- CREATE TABLE IF NOT EXISTS `download_total` (
--  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
--  `gmt_create` datetime NOT NULL COMMENT 'create time',
--  `gmt_modified` datetime NOT NULL COMMENT 'modified time',
--  `date` datetime NOT NULL COMMENT 'YYYY-MM-DD format',
--  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
--  `count` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'download count',
--  PRIMARY KEY (`id`),
--  UNIQUE KEY `date_name` (`date`, `name`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';
-- ALTER TABLE  `download_total` CHANGE  `name`  `name` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT  'module name';
-- ALTER TABLE  `download_total` CHANGE `date` `date` datetime NOT NULL COMMENT 'YYYY-MM-DD format';

CREATE TABLE IF NOT EXISTS `downloads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `gmt_create` datetime NOT NULL COMMENT 'create time',
  `gmt_modified` datetime NOT NULL COMMENT 'modified time',
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
  `date` int unsigned NOT NULL COMMENT 'YYYYMM format',
  `d01` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '01 download count',
  `d02` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '02 download count',
  `d03` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '03 download count',
  `d04` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '04 download count',
  `d05` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '05 download count',
  `d06` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '06 download count',
  `d07` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '07 download count',
  `d08` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '08 download count',
  `d09` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '09 download count',
  `d10` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '10 download count',
  `d11` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '11 download count',
  `d12` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '12 download count',
  `d13` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '13 download count',
  `d14` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '14 download count',
  `d15` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '15 download count',
  `d16` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '16 download count',
  `d17` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '17 download count',
  `d18` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '18 download count',
  `d19` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '19 download count',
  `d20` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '20 download count',
  `d21` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '21 download count',
  `d22` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '22 download count',
  `d23` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '23 download count',
  `d24` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '24 download count',
  `d25` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '25 download count',
  `d26` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '26 download count',
  `d27` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '27 download count',
  `d28` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '28 download count',
  `d29` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '29 download count',
  `d30` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '30 download count',
  `d31` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '31 download count',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_date` (`name`, `date`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';

CREATE TABLE IF NOT EXISTS `module_deps` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `deps` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'which module depend on this module',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name_deps` (`name`,`deps`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module deps';

CREATE TABLE IF NOT EXISTS `dist_dir` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(200) NOT NULL COMMENT 'dir name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `date` varchar(20) COMMENT '02-May-2014 01:06',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`parent`, `name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist dir info';

CREATE TABLE IF NOT EXISTS `dist_file` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) NOT NULL COMMENT 'file name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `date` varchar(20) COMMENT '02-May-2014 01:06',
 `size` int(10) unsigned NOT NULL COMMENT 'file size' DEFAULT '0',
 `sha1` varchar(40) COMMENT 'sha1 hex value',
 `url` varchar(2048),
 PRIMARY KEY (`id`),
 UNIQUE KEY `fullname` (`parent`, `name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist file info';
