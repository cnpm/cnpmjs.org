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

var Sequelize = require('sequelize');
var DataTypes = require('sequelize/lib/data-types');
var config = require('../config').database;

// add longtext for mysql
Sequelize.LONGTEXT = DataTypes.LONGTEXT = DataTypes.TEXT;
if (config.dialect === 'mysql') {
  Sequelize.LONGTEXT = DataTypes.LONGTEXT = 'LONGTEXT';
}

config.define = {
  timestamps: true,
  createdAt: 'gmt_create',
  updatedAt: 'gmt_modified',
  charset: 'utf8',
  collate: 'utf8_general_ci',
};

var sequelize = new Sequelize(config.db, config.username, config.password, config);

// sequelize.query('select * from user where id=?', null, { raw: true }, [1])
// .then(function (rows) {
//   console.log(rows);
// })
// .catch(function (err) {
//   console.log(err);
// });

module.exports = sequelize;
