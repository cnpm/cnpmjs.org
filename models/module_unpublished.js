/**!
 * cnpmjs.org - models/module_unpublished.js
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

var utils = require('./utils');

/*
CREATE TABLE IF NOT EXISTS `module_unpublished` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `package` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'base info: tags, time, maintainers, description, versions',
 PRIMARY KEY (`id`),
 UNIQUE KEY `module_unpublished_name` (`name`),
 KEY `module_unpublished_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module unpublished info';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleUnpublished', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name',
    },
    package: {
      type: DataTypes.LONGTEXT,
      comment: 'base info: tags, time, maintainers, description, versions',
      get: utils.JSONGetter('package'),
      set: utils.JSONSetter('package'),
    }
  }, {
    tableName: 'module_unpublished',
    comment: 'module unpublished info',
    indexes: [
      {
        unique: true,
        fields: ['name']
      },
      {
        fields: ['gmt_modified']
      }
    ],
    classMethods: {
      findByName: function* (name) {
        return yield this.find({
          where: {
            name: name
          }
        });
      },
      save: function* (name, pkg) {
        var row = yield this.find({
          where: {
            name: name
          }
        });
        if (row) {
          row.package = pkg;
          if (row.changed()) {
            row = yield row.save(['package']);
          }
          return row;
        }

        row = this.build({
          name: name,
          package: pkg,
        });
        return yield row.save();
      }
    }
  });
};
