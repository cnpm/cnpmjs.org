'use strict';

var urlparse = require('url').parse;
var urllib = require('urllib');
var HttpAgent = require('agentkeepalive');
var HttpsAgent = require('agentkeepalive').HttpsAgent;
var config = require('../config');
var url = require('url');
var URL = require('url').URL;

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

var request = urllib.HttpClient.prototype.request;

function getAccelerateUrl(url) {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const newHost = config.accelerateHostMap && config.accelerateHostMap[urlObj.host];
  if (newHost) {
    urlObj.host = newHost;
  }
  return urlObj.toString();
}

client.request = function (requestUrl, options) {
  const accelerateUrl = getAccelerateUrl(requestUrl);
  options = Object.assign({}, options, {
    formatRedirectUrl: function (from, to) {
      return getAccelerateUrl(url.resolve(from, to));
    }
  });
  return Reflect.apply(request, client, [ accelerateUrl, options ]);
};

module.exports = client;
module.exports.USER_AGENT = urllib.USER_AGENT;
