'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('ModuleAbbreviated', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'module name'
    },
    version: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'module version'
    },
    package: {
      type: DataTypes.LONGTEXT,
      comment: 'package.json',
    },
    publish_time: {
      type: DataTypes.BIGINT(20),
      allowNull: true,
    }
  }, {
    tableName: 'module_abbreviated',
    comment: 'module abbreviated info',
    indexes: [
      {
        unique: true,
        fields: ['name', 'version']
      },
      {
        fields: ['gmt_modified']
      },
      {
        fields: ['publish_time']
      },
    ],
    classMethods: {
      findByNameAndVersion: function* (name, version) {
        return yield this.find({
          where: { name: name, version: version }
        });
      }
    }
  });
};
