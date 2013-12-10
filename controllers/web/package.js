/*!
 * cnpmjs.org - controllers/web/package.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */
var Module = require('../../proxy/module');
var eventproxy = require('eventproxy');
var semver = require('semver');
var marked = require('marked');

exports.display = function (req, res, next) {
  var params = req.params;
  var name = params.name;
  var tag = params.version;
  var ep = eventproxy.create();
  ep.fail(next);

  if (tag) {
    var version = semver.valid(tag);
    if (version) {
      Module.get(name, version, ep.done('pkg'));
    } else {
      Module.getByTag(name, tag, ep.done('pkg'));
    }
  } else {
    Module.getByTag(name, 'latest', ep.done('pkg'));
  }

  ep.once('pkg', function (pkg) {
    if (!pkg || !pkg.package) {
      return next();
    }
    pkg = pkg.package;
    pkg.readme = marked(pkg.readme);

    //parse pkg.license
    pkg.license = pkg.license || pkg.licenses;
    if (Array.isArray(pkg.license)) {
      pkg.license = pkg.license[0];
    }
    if (typeof pkg.license === 'object') {
      pkg.license.name = pkg.license.name || pkg.license.type;
    }

    res.render('package', {
      title: pkg.name,
      package: pkg
    });
  });
};
