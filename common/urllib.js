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

function startMonitor() {
  var statInterval = 60000;

  var agents = [
    ['httpAgent', httpAgent],
    ['httpsAgent', httpsAgent]
  ];

  function agentStat() {
    for (var i = 0; i < agents.length; i++) {
      var type = agents[i][0];
      var agent = agents[i][1];
      var rate = '0';
      if (agent.createSocketCount > 0) {
        rate = (agent.requestCount / agent.createSocketCount).toFixed(0);
      }
      console.info('[%s] socket: %d created, %d close, %d timeout, request: %d requests, %s req/socket',
        type,
        agent.createSocketCount,
        agent.closeSocketCount,
        agent.timeoutSocketCount,
        agent.requestCount,
        rate
      );

      var name;
      for (name in agent.sockets) {
        console.info('working sockets %s: %d', name, agent.sockets[name].length);
      }
      for (name in agent.freeSockets) {
        console.info('free sockets %s: %d', name, agent.freeSockets[name].length);
      }
      for (name in agent.requests) {
        console.info('pedding requests %s: %d', name, agent.requests[name].length);
      }
      if (agent.requestCount >= 100000000) {
        agent.requestCount = 0;
        agent.createSocketCount = 0;
        agent.closeSocketCount = 0;
        agent.timeoutSocketCount = 0;
      }
    }
  }

  agentStat();
  return setInterval(agentStat, statInterval);
}

startMonitor();
