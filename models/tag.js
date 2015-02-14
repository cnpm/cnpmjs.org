/**!
 * cnpmjs.org - models/tag.js
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
CREATE TABLE IF NOT EXISTS `tag` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `tag` varchar(30) NOT NULL COMMENT 'tag name',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 `module_id` bigint(20) unsigned NOT NULL COMMENT 'module id',
 PRIMARY KEY (`id`),
 UNIQUE KEY `tag_name_tag` (`name`, `tag`),
 KEY `tag_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module tag';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Tag', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    tag: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'tag name',
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'module version',
    },
    module_id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      comment: 'module id'
    }
  }, {
    tableName: 'tag',
    comment: 'module tag',
    indexes: [
      {
        unique: true,
        fields: ['name', 'tag']
      },
      {
        fields: ['gmt_modified']
      }
    ],
    classMethods: {
      findByNameAndTag: function* (name, tag) {
        return yield this.find({ where: { name: name, tag: tag } });
      }
    }
  });
};
