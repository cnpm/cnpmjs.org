-- http://nodejs.org/dist/ mirror
CREATE TABLE `dist_dir` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(200) NOT NULL COMMENT 'user name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `date` varchar(20) COMMENT '02-May-2014 01:06',
 PRIMARY KEY (`id`),
 UNIQUE KEY `name` (`parent`, `name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist dir info';

CREATE TABLE `dist_file` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) NOT NULL COMMENT 'user name',
 `parent` varchar(200) NOT NULL COMMENT 'parent dir' DEFAULT '/',
 `date` varchar(20) COMMENT '02-May-2014 01:06',
 `size` int(10) unsigned NOT NULL COMMENT 'file size' DEFAULT '0',
 `sha1` varchar(40) COMMENT 'sha1 hex value',
 `url` varchar(2048),
 PRIMARY KEY (`id`),
 UNIQUE KEY `fullname` (`parent`, `name`),
 KEY `gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='dist file info';
