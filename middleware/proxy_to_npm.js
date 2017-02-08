'use strict';

const debug = require('debug')('cnpmjs.org:middleware:proxy_to_npm');
const config = require('../config');

module.exports = function(options) {
  let redirectUrl = config.sourceNpmRegistry;
  let proxyUrls = [
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

    const pathname = this.path;
    let match;
    for (let i = 0; i < proxyUrls.length; i++) {
      match = proxyUrls[i].test(pathname);
      if (match) {
        break;
      }
    }
    if (!match) {
      return yield next;
    }

    const url = redirectUrl + this.url;
    debug('proxy to %s', url);
    this.redirect(url);
  };
};
