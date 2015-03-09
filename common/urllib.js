/**!
 * cnpmjs.org - common/urllib.js
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

var urlparse = require('url').parse;
var urllib = require('urllib');
var HttpAgent = require('agentkeepalive');
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var config = require('../config');

var httpAgent;
var httpsAgent;

if (config.httpProxy) {
  var tunnel = require('tunnel-agent');
  var urlinfo = urlparse(config.httpProxy);
  if (urlinfo.protocol === 'http:') {
    httpAgent = tunnel.httpOverHttp({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port
      }
    });
    httpsAgent = tunnel.httpsOverHttp({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port
      }
    });
  } else if (urlinfo.protocol === 'https:') {
    httpAgent = tunnel.httpOverHttps({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port
      }
    });
    httpsAgent = tunnel.httpsOverHttps({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port
      }
    });
  } else {
    throw new TypeError('httpProxy format error: ' + config.httpProxy);
  }
} else {
  httpAgent = new HttpAgent({
    timeout: 0,
    keepAliveTimeout: 15000
  });
  httpsAgent = new HttpsAgent({
    timeout: 0,
    keepAliveTimeout: 15000
  });
}

var client = urllib.create({
  agent: httpAgent,
  httpsAgent: httpsAgent
});

module.exports = client;
module.exports.USER_AGENT = urllib.USER_AGENT;
