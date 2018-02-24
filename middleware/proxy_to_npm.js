'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:middleware:proxy_to_npm');
var config = require('../config');
var isPrivateScopedPackage = require('../lib/common').isPrivateScopedPackage;

function isProxyRegistryUrls (name) {
  // /@scope/:pkg, dont contains private scoped package
  if (/^\/@[\w\-\.]+\/[\w\-\.]+$/.test(name)) {
    var scopedPackage = name.replace(/\//, '');
    return !isPrivateScopedPackage(scopedPackage);
  }
  // /:pkg or /-/package/:pkg/dist-tags
  return /^\/[\w\-\.]+$|^\/\-\/package\/[\w\-\.]+\/dist-tags/.test(name);
}

function isProxyWebUrls (name) {
  // /package/:pkg
  return /^\/package\/[\w\-\.]+$/.test(name);
}


module.exports = function (options) {
  var redirectUrl = config.sourceNpmRegistry;
  var isProxyUrls = isProxyRegistryUrls;

  if (options && options.isWeb) {
    redirectUrl = redirectUrl.replace('//registry.', '//');
    isProxyUrls = isProxyWebUrls;
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

    if (!isProxyUrls(pathname)) {
      return yield next;
    }

    var url = redirectUrl + this.url;
    debug('proxy to %s', url);
    this.redirect(url);
  };
};
