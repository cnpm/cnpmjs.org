'use strict';

var debug = require('debug')('cnpmjs.org:middleware:proxy_to_npm');
var config = require('../config');

module.exports = function (options) {
  var redirectUrl = config.sourceNpmRegistry;
  var proxyUrls = [
    // /:pkg, dont contains scoped package
    // /:pkg/:versionOrTag
    /^\/[\w\-\.]+(?:\/[\w\-\.]+)?$/,
    // /-/package/:pkg/dist-tags
    /^\/\-\/package\/[\w\-\.]+\/dist-tags/,
  ];
  var scopedUrls = [
    // scoped package
    /^\/(@[\w\-\.]+)\/[\w\-\.]+(?:\/[\w\-\.]+)?$/,
    /^\/\-\/package\/(@[\w\-\.]+)\/[\w\-\.]+\/dist\-tags/,
  ];
  if (options && options.isWeb) {
    redirectUrl = config.sourceNpmWeb || redirectUrl.replace('//registry.', '//');
    proxyUrls = [
      // /package/:pkg
      /^\/package\/[\w\-\.]+/,
    ];
    scopedUrls = [
      // scoped package
      /^\/package\/(@[\w\-\.]+)\/[\w\-\.]+/,
    ];
  }

  return function* proxyToNpm(next) {
    if (config.syncModel !== 'none') {
      return yield next;
    }

    // syncModel === none
    // only proxy read requests
    if (this.method !== 'GET' && this.method !== 'HEAD') {
      return yield next;
    }

    var pathname = this.path;

    var isScoped = false;
    var isPublichScoped = false;
    // check scoped name
    if (config.scopes && config.scopes.length > 0) {
      for (var i = 0; i < scopedUrls.length; i++) {
        const m = scopedUrls[i].exec(pathname);
        if (m) {
          isScoped = true;
          if (config.scopes.indexOf(m[1]) !== -1) {
            // internal scoped
            isPublichScoped = false;
          } else {
            isPublichScoped = true;
          }
          break;
        }
      }
    }

    var isPublich = false;
    if (!isScoped) {
      for (var i = 0; i < proxyUrls.length; i++) {
        isPublich = proxyUrls[i].test(pathname);
        if (isPublich) {
          break;
        }
      }
    }

    if (isPublich || isPublichScoped) {
      var url = redirectUrl + this.url;
      debug('proxy isPublich: %s, isPublichScoped: %s, package to %s',
        isPublich, isPublichScoped, url);
      this.redirect(url);
      return;
    }

    yield next;
  };
};
