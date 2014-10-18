/**!
 * cnpmjs.org - models/download_total.js
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

// CREATE TABLE IF NOT EXISTS `download_total` (
//  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
//  `gmt_create` datetime NOT NULL COMMENT 'create time',
//  `gmt_modified` datetime NOT NULL COMMENT 'modified time',
//  `date` varchar(10) NOT NULL COMMENT 'YYYY-MM-DD format',
//  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
//  `count` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'download count',
//  PRIMARY KEY (`id`),
//  UNIQUE KEY `download_total_date_name` (`date`, `name`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('DownloadTotal', {
    date: {
      type: DataTypes.STRING(10),
      allowNull: false,
      comment: 'YYYY-MM-DD format',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    count: {
      type: DataTypes.BIGINT(20).UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: 'download count',
    }
  }, {
    tableName: 'download_total',
    comment: 'module download total info',
    indexes: [
      {
        unique: true,
        fields: ['date', 'name']
      }
    ],
    classMethods: {

    }
  });
};
