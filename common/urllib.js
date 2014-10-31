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

var urllib = require('urllib');
var HttpAgent = require('agentkeepalive');
var HttpsAgent = require('agentkeepalive').HttpsAgent;

var httpAgent = new HttpAgent({
  timeout: 0,
  keepAliveTimeout: 15000
});
var httpsAgent = new HttpsAgent({
  timeout: 0,
  keepAliveTimeout: 15000
});
var client = urllib.create({
  agent: httpAgent,
  httpsAgent: httpsAgent
});

module.exports = client;
module.exports.USER_AGENT = urllib.USER_AGENT;
