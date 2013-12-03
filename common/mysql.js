/*!
 * cnpmjs.org - common/mysql.js
 * Copyright(c) 2013 
 * Author: dead_horse <undefined>
 */

'use strict';

/**
 * Module dependencies.
 */

var config = require('../config');
var easymysql = require('easymysql');
var logger = require('./logger');

var mysqlConf = config.mysql;

var client = easymysql.create({maxconnection: mysqlConf.maxconnection});

client.on('error', function (err) {
  console.error(err);
  logger.error(err);
});

for (var i = 0; i < mysqlConf.servers.length; i++) {
  var item = config.mysqlServers[i];
  client.addserver({
    host: item.host,
    port: item.port,
    user: item.user,
    password: item.password,
    database: mysqlConf.database,
  });
}

client.queryOne = function queryOne(query, callback) {
  this.query(query, function (err, rows) {
    if (err) {
      return callback(err);
    }
    callback(null, rows && rows[0]);
  });
};

module.exports = client;
