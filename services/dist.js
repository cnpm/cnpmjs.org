/**!
 * cnpmjs.org - services/dist.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';
/* jshint -W032 */

/**
 * Module dependencies.
 */

var path = require('path');
var models = require('../models');
var File = models.DistFile;
var Dir = models.DistDir;

exports.savefile = function* (info) {
  var row = yield File.find({
    where: {
      parent: info.parent,
      name: info.name
    }
  });
  if (!row) {
    row = File.build({
      parent: info.parent,
      name: info.name
    });
  }
  row.date = info.date;
  row.size = info.size;
  row.url = info.url;
  row.sha1 = info.sha1;
  if (row.isDirty) {
    return yield row.save();
  }
  return row;
};

exports.savedir = function* (info) {
  var row = yield Dir.find({
    where: {
      parent: info.parent,
      name: info.name
    }
  });
  if (!row) {
    row = Dir.build({
      parent: info.parent,
      name: info.name
    });
  }
  row.date = info.date;
  if (row.isDirty) {
    return yield row.save();
  }
  return row;
};

exports.listdir = function* (name) {
  var rs = yield [
    File.findAll({
      attributrs: ['name', 'parent', 'date'],
      where: {
        parent: name
      }
    }),
    Dir.findAll({
      attributrs: ['name', 'parent', 'date', 'size', 'url', 'sha1'],
      where: {
        parent: name
      }
    })
  ];
  return rs[0].concat(rs[1]);
};

exports.getfile = function* (fullname) {
  var name = path.basename(fullname);
  var parent = path.dirname(fullname);
  if (parent !== '/') {
    parent += '/';
  }
  return yield File.find({
    attributrs: ['name', 'parent', 'date', 'size', 'url', 'sha1'],
    where: {
      parent: parent,
      name: name
    }
  });
};
