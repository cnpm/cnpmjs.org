/**!
 * cnpmjs.org - models/module_log.js
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
CREATE TABLE IF NOT EXISTS `module_log` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `username` varchar(100) NOT NULL,
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `log` longtext,
 PRIMARY KEY (`id`),
 KEY `module_log_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module sync log';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleLog', {
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user name'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    log: {
      type: DataTypes.LONGTEXT
    }
  }, {
    tableName: 'module_log',
    comment: 'module sync log',
    indexes: [
      {
        fields: ['name']
      }
    ],
    classMethods: {
    }
  });
};
