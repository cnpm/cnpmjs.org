/**!
 * cnpmjs.org - models/npm_module_maintainer.js
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
CREATE TABLE IF NOT EXISTS `npm_module_maintainer` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `user` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT 'user name',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 PRIMARY KEY (`id`),
 UNIQUE KEY `npm_module_maintainer_user_name` (`user`,`name`),
 KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='npm original module maintainers';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('NpmModuleMaintainer', {
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
    tableName: 'npm_module_maintainer',
    comment: 'npm original module maintainers',
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
    classMethods: require('./_module_maintainer_class_methods'),
  });
};
