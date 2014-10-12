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

var utility = require('utility');

module.exports = function (sequelize, DataTypes) {
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
    passwordSha: {
      field: 'password_sha',
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
      get: function () {
        var value = this.getDataValue('json');
        if (value) {
          value = JSON.parse(value);
        }
        return value;
      },
      set: function (value) {
        if (typeof value !== 'string') {
          value = JSON.stringify(value);
        }
        this.setDataValue('json', value);
      }
    },
    isNpmUser: {
      field: 'npm_user',
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'user sync from npm or not, 1: true, other: false',
    }
  }, {
    tableName: 'user',
    comment: 'user base info',
    indexes: [
      {
        name: 'name',
        unique: true,
        fields: ['name']
      },
      {
        name: 'gmt_modified',
        fields: ['gmt_modified']
      }
    ],
    classMethods: {
      // utils
      createPasswordSha: function (password, salt) {
        return utility.sha1(password + salt);
      },

      // read
      auth: function* (name, password) {
        var user = yield* this.findByName(name);
        if (user) {
          var sha = this.createPasswordSha(password, user.salt);
          if (user.passwordSha !== sha) {
            user = null;
          }
        }
        return user;
      },
      findByName: function* (name) {
        return yield this.find({ where: { name: name } });
      },
      listByNames: function* (names) {
        return yield this.findAll({
          where: {
            name: {
              in: names
            }
          }
        });
      },
      search: function* (query, options) {
        return yield this.findAll({
          where: {
            name: {
              like: query + '%'
            }
          },
          limit: options.limit
        });
      },

      // write
      saveNpmUser: function* (data) {
        var user = yield* this.findByName(data.name);
        if (!user) {
          user = this.build({
            isNpmUser: true,
            name: data.name,
            salt: '0',
            passwordSha: '0',
            ip: '0',
          });
        }
        user.json = data;
        user.email = data.email || '';
        user.rev = data._rev || '';
        return yield user.save();
      },
      saveCustomUser: function* (data) {
        // var sql = 'SELECT id, json FROM user WHERE name=?;';
        // var row = yield mysql.queryOne(sql, [data.user.login]);
        // var salt = data.salt || '0';
        // var password_sha = data.password_sha || '0';
        // var ip = data.ip || '0';
        // var rev = rev || '1-' + data.user.login;
        // var json = JSON.stringify(data.user);
        // if (!row) {
        //   sql = 'INSERT INTO user(npm_user, json, rev, name, email, salt, password_sha, ip, gmt_create, gmt_modified) \
        //     VALUES(2, ?, ?, ?, ?, ?, ?, ?, now(), now());';
        //   yield mysql.query(sql, [
        //     json, rev, data.user.login, data.user.email,
        //     salt, password_sha, ip
        //   ]);
        // } else {
        //   sql = 'UPDATE user SET json=?, rev=?, salt=?, password_sha=?, ip=? WHERE id=?;';
        //   yield mysql.query(sql, [
        //     json, rev,
        //     salt, password_sha, ip,
        //     row.id
        //   ]);
        // }
      },
    }
  });
};
