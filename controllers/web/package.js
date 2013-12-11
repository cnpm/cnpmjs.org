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
    pkg.readme = marked(pkg.readme || '');

    setLicense(pkg);
    
    res.render('package', {
      title: 'Package - ' + pkg.name,
      package: pkg
    });
  });
};

exports.search = function (req, res, next) {
  var params = req.params;
  var word = req.params.word;
  Module.search(word, function (err, mods) {
    if (err) {
      return next(err);
    }
    var packages = mods.map(function (m) {
      try {
        m.package = JSON.parse(m.package);
      } catch (err) {
        m.package = {};
      }
      return {
        name: m.package.name,
        description: m.package.description
      };
    });

    res.render('search', {
      title: 'Keyword - ' + word,
      keyword: word,
      packages: packages
    });
  });
};

function setLicense (pkg) {
  var license;
  license = pkg.license || pkg.licenses || pkg.licence || pkg.licences;
  if (!license) {
    return ;
  }

  if (Array.isArray(license)) {
    license = license[0];
  }

  if (typeof license === 'object') {
    pkg.license = {
      name: license.name || license.type,
      url: license.url
    };
  }

  if (typeof license === 'string') {
    if (license.match(/(http|https)(:\/\/)/ig)) {
      pkg.license = {
        name: license,
        url: license
      };
    } else {
      pkg.license = {
        url: getOssLicenseUrlFromName(license),
        name: license
      };
    }
  }
}

function getOssLicenseUrlFromName (name) {
  var base = 'http://opensource.org/licenses/';

  var licenseMap = {
    'bsd': 'BSD-2-Clause',
    'mit': 'MIT',
    'x11': 'MIT',
    'mit/x11': 'MIT',
    'apache 2.0': 'Apache-2.0',
    'apache2': 'Apache-2.0',
    'apache 2': 'Apache-2.0',
    'apache-2': 'Apache-2.0',
    'apache': 'Apache-2.0',
    'gpl': 'GPL-3.0',
    'gplv3': 'GPL-3.0',
    'gplv2': 'GPL-2.0',
    'gpl3': 'GPL-3.0',
    'gpl2': 'GPL-2.0',
    'lgpl': 'LGPL-2.1',
    'lgplv2.1': 'LGPL-2.1',
    'lgplv2': 'LGPL-2.1'
  };

  return licenseMap[name.toLowerCase()] ? 
          base + licenseMap[name.toLowerCase()] : base + name;
}
