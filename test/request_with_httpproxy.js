/**!
 * cnpmjs.org - test/request_with_httpproxy.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <m@fengmk2.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

// usage: http_proxy=$http_proxy node test/request_with_httpproxy.js $url

var config = require('../config');
config.httpProxy = process.env.http_proxy || process.env.https_proxy;
var urllib = require('../common/urllib');

var url = process.argv[2] || 'https://registry.npmjs.com';

urllib.request(url, {
  timeout: 15000,
}, function (err, data, res) {
  console.log(err);
  console.log(res.status, res.headers);
  // console.log(data.toString());
});
