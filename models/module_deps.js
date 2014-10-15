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
 `deps` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'which module depend on this module',
 PRIMARY KEY (`id`),
 UNIQUE KEY `module_deps_name_deps` (`name`,`deps`),
 KEY `name` (`module_deps_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module deps';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleDeps', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    deps: {
      type: DataTypes.STRING(100),
      comment: 'which module depend on this module'
    }
  }, {
    tableName: 'module_deps',
    comment: 'module deps',
    indexes: [
      {
        unique: true,
        fields: ['name', 'deps']
      },
      {
        fields: ['name']
      }
    ],
    classMethods: {
    }
  });
};
