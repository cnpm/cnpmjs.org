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
  `id` INTEGER NOT NULL auto_increment ,
  `author` VARCHAR(100) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `version` VARCHAR(30) NOT NULL,
  `description` LONGTEXT,
  `package` LONGTEXT,
  `dist_shasum` VARCHAR(100),
  `dist_tarball` VARCHAR(2048),
  `dist_size` INTEGER UNSIGNED NOT NULL DEFAULT 0,
  `publish_time` BIGINT(20) UNSIGNED,
  `gmt_create` DATETIME NOT NULL,
  `gmt_modified` DATETIME NOT NULL,
  PRIMARY KEY (`id`)
)
COMMENT 'module info' ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE utf8_general_ci;

CREATE UNIQUE INDEX `module_name_version` ON `module` (`name`, `version`);
CREATE INDEX `module_gmt_modified` ON `module` (`gmt_modified`);
CREATE INDEX `module_publish_time` ON `module` (`publish_time`);
CREATE INDEX `module_author` ON `module` (`author`);
*/

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Module', {
    author: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'first maintainer name'
    },
    name: {
      type: DataTypes.STRING(100),
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
    },
    package: {
      type: DataTypes.LONGTEXT,
      comment: 'package.json',
    },
    dist_shasum: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dist_tarball: {
      type: DataTypes.STRING(2048),
      allowNull: true,
    },
    dist_size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    publish_time: {
      type: DataTypes.BIGINT(20),
      allowNull: true,
    }
  }, {
    tableName: 'module',
    comment: 'module info',
    indexes: [
      {
        unique: true,
        fields: ['name', 'version']
      },
      {
        fields: ['gmt_modified']
      },
      {
        fields: ['publish_time']
      },
      {
        fields: ['author']
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
