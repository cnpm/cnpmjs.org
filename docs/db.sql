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

CREATE TABLE `module` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `author` varchar(100) NOT NULL,
 `name` varchar(100) NOT NULL COMMENT 'module name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `package` longtext COMMENT 'package.json',
 `dist_shasum` varchar(100) DEFAULT NULL,
 `dist_tarball` varchar(2048) DEFAULT NULL,
 `dist_size` int(10) unsigned NOT NULL DEFAULT '0',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`,`version`),
 KEY `gmt_modified` (`gmt_modified`),
 KEY `author` (`author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module info';

CREATE TABLE `module_log` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `username` varchar(100) NOT NULL,
 `name` varchar(100) NOT NULL COMMENT 'module name',
 `log` longtext,
 PRIMARY KEY (`id`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module sync log';

CREATE TABLE `tag` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) NOT NULL COMMENT 'module name',
 `tag` varchar(30) NOT NULL COMMENT 'tag name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`name`, `tag`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module tag';

CREATE TABLE `total` (
 `name` varchar(100) NOT NULL COMMENT 'total name',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `module_delete` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'module delete count',
 PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='total info';
INSERT INTO total(name, gmt_modified, module_delete) VALUES('total', now(), 0);

CREATE TABLE `download_total` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `date` varchar(10) NOT NULL COMMENT 'YYYY-MM-DD format',
 `name` varchar(100) NOT NULL COMMENT 'module name',
 `count` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'download count',
 PRIMARY KEY (`id`),
 UNIQUE KEY `date_name` (`date`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';
