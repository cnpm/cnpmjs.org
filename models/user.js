/**!
 * cnpmjs.org - models/user.js
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

const utility = require('utility');
const utils = require('./utils');

/*
CREATE TABLE IF NOT EXISTS `user` (
 `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
 `gmt_create` datetime NOT NULL COMMENT 'create time',
 `gmt_modified` datetime NOT NULL COMMENT 'modified time',
 `name` varchar(100) NOT NULL COMMENT 'user name',
 `salt` varchar(100) NOT NULL,
 `password_sha` varchar(100) NOT NULL COMMENT 'user password hash',
 `ip` varchar(64) NOT NULL COMMENT 'user last request ip',
 `roles` varchar(200) NOT NULL DEFAULT '[]',
 `rev` varchar(40) NOT NULL,
 `email` varchar(400) NOT NULL,
 `json` longtext CHARACTER SET utf8 COLLATE utf8_general_ci COMMENT 'json details',
 `npm_user` tinyint(1) DEFAULT '0' COMMENT 'user sync from npm or not, 1: true, other: false',
 PRIMARY KEY (`id`),
 UNIQUE KEY `user_name` (`name`),
 KEY `user_gmt_modified` (`gmt_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='user base info';
*/

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('User', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user name',
    },
    salt: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password_sha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'user password hash',
    },
    ip: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'user last request ip',
    },
    roles: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '[]',
    },
    rev: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(400),
      allowNull: false,
    },
    json: {
      type: DataTypes.LONGTEXT,
      allowNull: true,
      get: utils.JSONGetter('json'),
      set: utils.JSONSetter('json'),
    },
    isNpmUser: {
      field: 'npm_user',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'user sync from npm or not, 1: true, other: false',
    },
  }, {
    tableName: 'user',
    comment: 'user base info',
    indexes: [
      {
        unique: true,
        fields: [ 'name' ],
      },
      {
        fields: [ 'gmt_modified' ],
      },
    ],
    classMethods: {
      // utils
      createPasswordSha(password, salt) {
        return utility.sha1(password + salt);
      },

      // read
      * auth(name, password) {
        let user = yield this.findByName(name);
        if (user) {
          const sha = this.createPasswordSha(password, user.salt);
          if (user.password_sha !== sha) {
            user = null;
          }
        }
        return user;
      },
      * findByName(name) {
        return yield this.find({ where: { name } });
      },
      * listByNames(names) {
        if (!names || names.length === 0) {
          return [];
        }
        return yield this.findAll({
          where: {
            name: {
              in: names,
            },
          },
        });
      },
      * search(query, options) {
        return yield this.findAll({
          where: {
            name: {
              like: query + '%',
            },
          },
          limit: options.limit,
        });
      },

      // write
      * saveNpmUser(data) {
        let user = yield this.findByName(data.name);
        if (!user) {
          user = this.build({
            isNpmUser: true,
            name: data.name,
            salt: '0',
            password_sha: '0',
            ip: '0',
          });
        }
        user.isNpmUser = true;
        user.json = data;
        user.email = data.email || '';
        user.rev = data._rev || '';
        if (user.changed()) {
          user = yield user.save();
        }
        return user;
      },
      * saveCustomUser(data) {
        const name = data.user.login;
        let user = yield this.findByName(name);
        if (!user) {
          user = this.build({
            isNpmUser: false,
            name,
          });
        }

        const rev = '1-' + data.user.login;
        const salt = data.salt || '0';
        const passwordSha = data.password_sha || '0';
        const ip = data.ip || '0';

        user.isNpmUser = false;
        user.email = data.user.email;
        user.ip = ip;
        user.json = data.user;
        user.rev = rev;
        user.salt = salt;
        user.password_sha = passwordSha;
        if (user.changed()) {
          user = yield user.save();
        }
        return user;
      },

      // add cnpm user
      * add(user) {
        let roles = user.roles || [];
        try {
          roles = JSON.stringify(roles);
        } catch (e) {
          roles = '[]';
        }
        const rev = '1-' + utility.md5(JSON.stringify(user));

        const row = this.build({
          rev,
          name: user.name,
          email: user.email,
          salt: user.salt,
          password_sha: user.password_sha,
          ip: user.ip,
          roles,
          isNpmUser: false,
        });

        return yield row.save();
      },

      * update(user) {
        const rev = user.rev || user._rev;
        let revNo = Number(rev.split('-', 1));
        if (!revNo) {
          const err = new Error(rev + ' format error');
          err.name = 'RevFormatError';
          err.data = { user };
          throw err;
        }
        revNo++;
        const newRev = revNo + '-' + utility.md5(JSON.stringify(user));
        let roles = user.roles || [];
        try {
          roles = JSON.stringify(roles);
        } catch (e) {
          roles = '[]';
        }

        const row = yield this.findByName(user.name);
        if (!row) {
          return null;
        }

        row.rev = newRev;
        row.email = user.email;
        row.salt = user.salt;
        row.password_sha = user.password_sha;
        row.ip = user.ip;
        row.roles = roles;
        row.isNpmUser = false;

        return yield row.save([ 'rev', 'email', 'salt', 'password_sha', 'ip', 'roles', 'isNpmUser' ]);
      },
    },
  });
};
