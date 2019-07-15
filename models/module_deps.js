/**!
 * cnpmjs.org - models/module_deps.js
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
CREATE TABLE IF NOT EXISTS `module_deps` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `deps` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT '`name` is deped by `deps`',
 PRIMARY KEY (`id`),
 UNIQUE KEY `module_deps_name_deps` (`name`,`deps`),
 KEY `deps` (`module_deps_deps`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module deps';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleDependency', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    dependent: {
      field: 'deps',
      type: DataTypes.STRING(100),
      comment: '`name` is depended by `deps`. `deps` == depend => `name`'
    }
  }, {
    tableName: 'module_deps',
    comment: 'module deps',
    // no need update timestamp
    updatedAt: false,
    indexes: [
      {
        unique: true,
        fields: ['name', 'deps']
      },
      {
        fields: ['deps']
      }
    ],
    classMethods: {
    }
  });
};
