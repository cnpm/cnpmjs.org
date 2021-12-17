'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('BlockPackageVersion', {
    name: {
      type: DataTypes.STRING(214),
      allowNull: false,
      comment: 'package name'
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'package version'
    },
    reason: {
      type: DataTypes.LONGTEXT,
      comment: 'block reason',
    },
  }, {
    tableName: 'package_version_blocklist',
    comment: 'package version block list',
    indexes: [
      {
        unique: true,
        fields: ['name', 'version'],
      },
    ],
  });
};
