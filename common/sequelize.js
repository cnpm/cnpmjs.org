'use strict';

var Sequelize = require('sequelize');
var DataTypes = require('sequelize/lib/data-types');
var config = require('../config');

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
  var server = config.mysqlServers[0];
  var dialectOptions = config.database && config.database.dialectOptions;
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
  if (dialectOptions) {
    config.database.dialectOptions = dialectOptions;
  }
}

var database = config.database;

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
  // 设置为utf8mb4，解决数据库模块 description 字段 emoji 表情插入失败问题
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

var sequelize = new Sequelize(database.db, database.username, database.password, database);

module.exports = sequelize;
