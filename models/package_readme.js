'use strict';

module.exports = function (sequelize, DataTypes) {
  return sequelize.define('PackageReadme', {
    name: {
      type: DataTypes.STRING(100),
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
        fields: ['name']
      },
      {
        fields: ['gmt_modified']
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
