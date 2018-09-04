'use strict';

/*
CREATE TABLE IF NOT EXISTS `package_readme` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(214) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
 `readme` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'the latest version readme',
 `version` varchar(30) NOT NULL COMMENT 'module version',
 PRIMARY KEY (`id`),
 UNIQUE KEY `uk_name` (`name`),
 KEY `idx_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='package latest readme';
 */

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PackageReadme', {
    name: {
      type: DataTypes.STRING(214),
      allowNull: false,
      comment: 'module name'
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'module latest version'
    },
    readme: {
      type: DataTypes.LONGTEXT,
      comment: 'latest version readme',
    },
  }, {
    tableName: 'package_readme',
    comment: 'package latest readme',
    indexes: [
      {
        unique: true,
        fields: ['name'],
      },
      {
        fields: ['gmt_modified'],
      },
    ],
    classMethods: {
      findByName: function* (name) {
        return yield this.find({
          where: { name: name },
        });
      }
    }
  });
};
