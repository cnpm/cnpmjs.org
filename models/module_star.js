/**!
 * cnpmjs.org - models/module_star.js
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
CREATE TABLE IF NOT EXISTS `module_star` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'user name',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 PRIMARY KEY (`id`),
 UNIQUE KEY `module_star_user_name` (`user`,`name`),
 KEY `module_star_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module star';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleStar', {
    user: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user name'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    }
  }, {
    tableName: 'module_star',
    comment: 'module star',
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['user', 'name']
      },
      {
        fields: ['name']
      }
    ],
    classMethods: {
    }
  });
};
