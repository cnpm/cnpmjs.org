'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:middleware:proxy_to_npm');
var config = require('../config');

module.exports = function (options) {
  var redirectUrl = config.sourceNpmRegistry;
  var proxyUrls = [
    // /:pkg, dont contains scoped package
    /^\/[\w\-\.]+$/,
    // /-/package/:pkg/dist-tags
    /^\/\-\/package\/[\w\-\.]+\/dist-tags/,
  ];
  if (options && options.isWeb) {
    redirectUrl = redirectUrl.replace('//registry.', '//');
    proxyUrls = [
      // /package/:pkg
      /^\/package\/[\w\-\.]+$/,
    ];
  }
  return function* proxyToNpm(next) {
    if (config.syncModel !== 'none') {
      return yield next;
    }
    // only proxy read requests
    if (this.method !== 'GET' && this.method !== 'HEAD') {
      return yield next;
    }

    var pathname = this.path;
    var match;
    for (var i = 0; i < proxyUrls.length; i++) {
      match = proxyUrls[i].test(pathname);
      if (match) {
        break;
      }
    }
    if (!match) {
      return yield next;
    }

    var url = redirectUrl + this.url;
    debug('proxy to %s', url);
    this.redirect(url);
  };
};
