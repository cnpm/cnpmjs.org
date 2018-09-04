/**!
 * cnpmjs.org - models/module.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

/*
CREATE TABLE IF NOT EXISTS `module` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `author` varchar(100) NOT NULL COMMENT 'module author',
 `name` varchar(214) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `description` longtext COMMENT 'module description',
 `package` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'package.json',
 `dist_shasum` varchar(100) DEFAULT NULL COMMENT 'module dist SHASUM',
 `dist_tarball` varchar(2048) DEFAULT NULL COMMENT 'module dist tarball',
 `dist_size` int(10) unsigned NOT NULL DEFAULT '0' COMMENT 'module dist size',
 `publish_time` bigint(20) unsigned COMMENT 'module publish time',
 PRIMARY KEY (`id`),
 UNIQUE KEY `uk_name` (`name`,`version`),
 KEY `idx_gmt_modified` (`gmt_modified`),
 KEY `idx_publish_time` (`publish_time`),
 KEY `idx_author` (`author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module info';
*/

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Module', {
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'first maintainer name'
    },
    name: {
      type: DataTypes.STRING(214),
      allowNull: false,
      comment: 'module name'
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'module version'
    },
    description: {
      type: DataTypes.LONGTEXT,
      comment: 'module description',
    },
    package: {
      type: DataTypes.LONGTEXT,
      comment: 'package.json',
    },
    dist_shasum: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'module dist SHASUM',
    },
    dist_tarball: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: 'module dist tarball',
    },
    dist_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'module dist size',
    },
    publish_time: {
      type: DataTypes.BIGINT(20),
      allowNull: true,
      comment: 'module publish time',
    }
  }, {
    tableName: 'module',
    comment: 'module info',
    indexes: [
      {
        unique: true,
        fields: ['name', 'version'],
      },
      {
        fields: ['gmt_modified'],
      },
      {
        fields: ['publish_time'],
      },
      {
        fields: ['author'],
      }
    ],
    classMethods: {
      findByNameAndVersion: function* (name, version) {
        return yield this.find({
          where: { name: name, version: version }
        });
      }
    }
  });
};
