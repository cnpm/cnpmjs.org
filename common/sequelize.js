/**!
 * cnpmjs.org - common/sequelize.js
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

const Sequelize = require('sequelize');
const DataTypes = require('sequelize/lib/data-types');
const config = require('../config');

if (config.mysqlServers && config.database.dialect === 'sqlite') {
  // https://github.com/cnpm/cnpmjs.org/wiki/Migrating-from-1.x-to-2.x
  // forward compat with old style on 1.x
  // mysqlServers: [
  //   {
  //     host: '127.0.0.1',
  //     port: 3306,
  //     user: 'root',
  //     password: ''
  //   }
  // ],
  // mysqlDatabase: 'cnpmjs_test',
  // mysqlMaxConnections: 4,
  // mysqlQueryTimeout: 5000,

  console.warn('[WARNNING] your config.js was too old, please @see https://github.com/cnpm/cnpmjs.org/wiki/Migrating-from-1.x-to-2.x');
  const server = config.mysqlServers[0];
  config.database = {
    db: config.mysqlDatabase,
    username: server.user,
    password: server.password,
    dialect: 'mysql',
    host: server.host,
    port: server.port,
    pool: {
      maxConnections: config.mysqlMaxConnections || 10,
      minConnections: 0,
      maxIdleTime: 30000,
    },
    logging: !!process.env.SQL_DEBUG,
  };
}

const database = config.database;

// sync database before app start, defaul is false
database.syncFirst = false;

// add longtext for mysql
Sequelize.LONGTEXT = DataTypes.LONGTEXT = DataTypes.TEXT;
if (config.dialect === 'mysql') {
  Sequelize.LONGTEXT = DataTypes.LONGTEXT = 'LONGTEXT';
}

database.define = {
  timestamps: true,
  createdAt: 'gmt_create',
  updatedAt: 'gmt_modified',
  charset: 'utf8',
  collate: 'utf8_general_ci',
};

const sequelize = new Sequelize(database.db, database.username, database.password, database);

module.exports = sequelize;
