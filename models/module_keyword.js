/**!
 * cnpmjs.org - models/module_keyword.js
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
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleKeyword', {
    keyword: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    description: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
    }
  }, {
    tableName: 'module_keyword',
    comment: 'module keyword',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['keyword', 'name']
      },
      {
        fields: ['name']
      }
    ],
    classMethods: {
      findByKeywordAndName: function* (keyword, name) {
        return yield this.find({
          where: {
            keyword: keyword,
            name: name
          }
        });
      }
    }
  });
};
