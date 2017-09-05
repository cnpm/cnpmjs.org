#!/usr/bin/env node

/**!
 * Copyright(c) cnpm and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:cli');
var program = require('commander');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var treekill = require('treekill');
var version = require('../package.json').version;

function list(val) {
  return val.split(',');
}

program
  .version(version);

program
  .command('start')
  .description('start cnpmjs.org server')
  .option('--admins <admins>', 'set admins', list)
  .option('--scopes <scopes>', 'set scopes', list)
  // .option('--cluster', 'enable cluster mode')
  .option('--dataDir <dataDir>', 'cnpmjs.org data dir, default is `$HOME/.cnpmjs.org`')
  .action(start);

program
  .command('stop')
  .description('stop cnpmjs.org server')
  .option('--dataDir <dataDir>', 'cnpmjs.org data dir, default is `$HOME/.cnpmjs.org`')
  .action(stop);

program.parse(process.argv);


function start(options) {
  stop(options)
    // wait for "stop" method to remove the pid file
    .then(function () {
      var dataDir = options.dataDir || path.join(process.env.HOME, '.cnpmjs.org');
      mkdirp.sync(dataDir);

      var configfile = path.join(dataDir, 'config.json');
      var config = {};
      if (fs.existsSync(configfile)) {
        try {
          config = require(configfile);
        } catch (err) {
          console.warn('load old %s error: %s', configfile, err);
        }
      }
      // config.enableCluster = !!options.cluster;
      if (options.admins) {
        config.admins = {};
        for (var i = 0; i < options.admins.length; i++) {
          config.admins[options.admins[i]] = options.admins[i] + '@localhost.com';
        }
      }
      if (options.scopes) {
        config.scopes = options.scopes.map(function (name) {
          if (name[0] !== '@') {
            name = '@' + name;
          }
          return name;
        });
      }

      var configJSON = JSON.stringify(config, null, 2);
      fs.writeFileSync(configfile, configJSON);

      debug('save config %s to %s', configJSON, configfile);

      // if sqlite db file not exists, init first
      initDatabase(function() {
        require('../dispatch');
      });

      fs.writeFileSync(path.join(dataDir, 'pid'), process.pid + '');
    });
}

function stop(options) {
  var dataDir = options.dataDir || path.join(process.env.HOME, '.cnpmjs.org');
  var pidfile = path.join(dataDir, 'pid');
  return new Promise(function (resolve) {
    if (!fs.existsSync(pidfile)) {
      resolve();
      return;
    }
    var pid = Number(fs.readFileSync(pidfile, 'utf8'));
    treekill(pid, function (err) {
      if (err) {
        console.log(err);
        throw err;
      }
      console.log('cnpmjs.org server:%d stop', pid);
      fs.unlinkSync(pidfile);
      resolve();
    });
  });
}

function initDatabase(callback) {
  var models = require('../models');

  models.sequelize.sync({ force: false })
    .then(function () {
      models.Total.init(function (err) {
        if (err) {
          console.error('[models/init_script.js] sequelize init fail');
          console.error(err);
          throw err;
        } else {
          console.log('[models/init_script.js] `sqlite` sequelize sync and init success');
          callback();
        }
      });
    })
    .catch(function (err) {
      console.error('[models/init_script.js] sequelize sync fail');
      console.error(err);
      throw err;
    });
}
