/**!
 * cnpmjs.org - models/total.js
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

// CREATE TABLE IF NOT EXISTS `total` (
//  `name` varchar(100) NOT NULL COMMENT 'total name',
//  `gmt_modified` datetime NOT NULL COMMENT 'modified time',
//  `module_delete` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'module delete count',
//  `last_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync from official registry',
//  `last_exist_sync_time` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT 'last timestamp sync exist packages from official registry',
//  `sync_status` tinyint unsigned NOT NULL DEFAULT '0' COMMENT 'system sync from official registry status',
//  `need_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages need to be sync',
//  `success_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync success at this time',
//  `fail_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages sync fail at this time',
//  `left_sync_num` int unsigned NOT NULL DEFAULT '0' COMMENT 'how many packages left to be sync',
//  `last_sync_module` varchar(100) COMMENT 'last sync success module name',
//  PRIMARY KEY (`name`)
// ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='total info';
// -- init `total` count
// INSERT INTO total(name, gmt_modified) VALUES('total', now())
//   ON DUPLICATE KEY UPDATE gmt_modified=now();

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('Total', {
    name: {
      type: DataTypes.STRING(100),
      primaryKey: true,
      comment: 'total name'
    },
    module_delete: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      defaultValue: 0,
      comment: 'module delete count',
    },
    last_sync_time: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      defaultValue: 0,
      comment: 'last timestamp sync from official registry',
    },
    last_exist_sync_time: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      defaultValue: 0,
      comment: 'last timestamp sync exist packages from official registry',
    },
    sync_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'system sync from official registry status',
    },
    need_sync_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'how many packages need to be sync',
    },
    success_sync_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'how many packages sync success at this time',
    },
    fail_sync_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'how many packages sync fail at this time',
    },
    left_sync_num: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'how many packages left to be sync',
    },
    last_sync_module: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'last sync success module name',
    },
  }, {
    tableName: 'total',
    comment: 'total info',
    createdAt: false,
    classMethods: {
      init: function (callback) {
        var that = this;
        that.find({
          where: { name: 'total' }
        }).then(function (row) {
          if (!row) {
            that.build({name: 'total'}).save()
              .then(function () {
                callback();
              })
              .catch(callback);
            return;
          }
          callback();
        }).catch(callback);
      }
    }
  });
};
