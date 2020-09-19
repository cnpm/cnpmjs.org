'use strict';

/*
CREATE TABLE IF NOT EXISTS `token` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `token` varchar(100) NOT NULL COMMENT 'token',
 `user_id` varchar(100) NOT NULL COMMENT 'user name',
 `readonly` tinyint NOT NULL DEFAULT 0 COMMENT 'readonly or not, 1: true, other: false',
 `token_key` varchar(200) NOT NULL COMMENT 'token sha512 hash',
 `cidr_whitelist` varchar(500) NOT NULL COMMENT 'ip list, ["127.0.0.1"]',
 PRIMARY KEY (`id`),
 UNIQUE KEY `uk_token` (`token`),
 KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='token info';
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Token', {
    token: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'token',
    },
    userId: {
      field: 'user_id',
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user name'
    },
    readonly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'readonly or not, 1: true, other: false',
    },
    key: {
      field: 'token_key',
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: 'token sha512 hash',
    },
    cidrWhitelist: {
      field: 'cidr_whitelist',
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: 'ip list, ["127.0.0.1"]',
      get: function () {
        try {
          return JSON.parse(this.getDataValue('cidrWhitelist'));
        } catch (_) {
          return [];
        }
      },
      set: function (val) {
        try {
          var stringifyVal = JSON.stringify(val);
          this.setDataValue('cidrWhitelist', stringifyVal);
        } catch (_) {
          // ...
        }
      }
    },
  }, {
    tableName: 'token',
    comment: 'token info',
    indexes: [
      {
        unique: true,
        fields: [ 'token' ],
      },
      {
        fields: [ 'user_id' ],
      }
    ],
    classMethods: {
      findByToken: function* (token) {
        return yield this.find({ where: { token: token } });
      },
      add: function* (tokenObj) {
        var row = this.build(tokenObj);
        return yield row.save();
      },
      listByUser: function* (userId, offset, limit) {
        return yield this.findAll({
          where: {
            userId: userId,
          },
          limit: limit,
          offset: offset,
          order: 'id asc',
        });
      },
      deleteByKeyOrToken: function* (userId, keyOrToken) {
        var self = this;
        yield sequelize.transaction(function () {
          return self.destroy({
            where: {
              userId: userId,
              $or: [
                {
                  key: {
                    like: keyOrToken + '%',
                  },
                }, {
                  token: keyOrToken,
                }
              ],
            },
          }).then(function (affectedRows) {
            if (affectedRows > 1) {
              throw new Error(`Token ID "${keyOrToken}" was ambiguous`);
            }
          });
        });
      },
    },
  });
};
