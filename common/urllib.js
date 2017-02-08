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

const urlparse = require('url').parse;
const urllib = require('urllib');
const HttpAgent = require('agentkeepalive');
const HttpsAgent = require('agentkeepalive').HttpsAgent;
const config = require('../config');

let httpAgent;
let httpsAgent;

if (config.httpProxy) {
  const tunnel = require('tunnel-agent');
  const urlinfo = urlparse(config.httpProxy);
  if (urlinfo.protocol === 'http:') {
    httpAgent = tunnel.httpOverHttp({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port,
      },
    });
    httpsAgent = tunnel.httpsOverHttp({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port,
      },
    });
  } else if (urlinfo.protocol === 'https:') {
    httpAgent = tunnel.httpOverHttps({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port,
      },
    });
    httpsAgent = tunnel.httpsOverHttps({
      proxy: {
        host: urlinfo.hostname,
        port: urlinfo.port,
      },
    });
  } else {
    throw new TypeError('httpProxy format error: ' + config.httpProxy);
  }
} else {
  httpAgent = new HttpAgent({
    timeout: 0,
    keepAliveTimeout: 15000,
  });
  httpsAgent = new HttpsAgent({
    timeout: 0,
    keepAliveTimeout: 15000,
  });
}

const client = urllib.create({
  agent: httpAgent,
  httpsAgent,
});

module.exports = client;
module.exports.USER_AGENT = urllib.USER_AGENT;
