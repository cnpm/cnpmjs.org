'use strict';

/*
CREATE TABLE IF NOT EXISTS `token` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `token` varchar(200) NOT NULL COMMENT 'token',
 `user` varchar(100) NOT NULL COMMENT 'user name',
 `readonly` tinyint(1) DEFAULT '0' COMMENT 'readonly or not, 1: true, other: false',
 `token_key` varchar(200) NOT NULL COMMENT 'token sha512 hash',
 `cidr_whitelist` varchar(500) NOT NULL COMMENT 'ip list, ["127.0.0.1"]',
 PRIMARY KEY (`id`),
 KEY `idx_token` (`token`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='token info';
 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Token', {
    token: {
      type: DataTypes.STRING(256),
      allowNull: false,
      comment: 'token',
    },
    user: {
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
    },
  }, {
    tableName: 'token',
    comment: 'token info',
    indexes: [
      {
        fields: [ 'token' ],
      }
    ],
    classMethods: {
      findByToken: function* (token) {
        return yield this.find({ where: { token: token } });
      },
      add: function* (tokenObj) {
        var whiteList = [];
        try {
          whiteList = JSON.stringify(tokenObj.cidrWhitelist);
        } catch (_) {
          // ...
        }
        var row = this.build({
          token: tokenObj.token,
          user: tokenObj.user,
          readonly: tokenObj.readonly,
          key: tokenObj.key,
          cidrWhitelist: whiteList,
        });
        return yield row.save();
      },
      listByUser: function* (user, offset, limit) {
        return yield this.findAll({
          where: {
            user: user,
          },
          limit: limit,
          offset: offset,
          order: 'id asc',
        });
      },
      deleteByKeyOrToken: function* (user, keyOrToken) {
        return yield this.destroy({
          where: {
            user: user,
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
        });
      },
    },
  });
};
