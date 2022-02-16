'use strict';

var childProcess = require('child_process');
var path = require('path');
var util = require('util');
var cfork = require('cfork');
var config = require('./config');
var workerPath = path.join(__dirname, 'worker.js');
var syncPath = path.join(__dirname, 'sync');
var scopeSyncPath = path.join(__dirname, 'sync/sync_scope');

console.log('Starting cnpmjs.org ...\ncluster: %s\nadmins: %j\nscopes: %j\nsourceNpmRegistry: %s\nsyncModel: %s',
  config.enableCluster, config.admins, config.scopes, config.sourceNpmRegistry, config.syncModel);

if (config.enableCluster) {
  forkWorker();
  config.syncModel !== 'none' && forkSyncer();
  // sync assign pravate scope package
  config.syncScope && forkScopeSyncer();
} else {
  require(workerPath);
  config.syncModel !== 'none' && require(syncPath);
  // sync assign pravate scope package
  config.syncScope && require(scopeSyncPath);
}

function forkWorker() {
  cfork({
    exec: workerPath,
    count: config.numCPUs,
  }).on('fork', function (worker) {
    console.log('[%s] [worker:%d] new worker start', Date(), worker.process.pid);
  }).on('disconnect', function (worker) {
    console.error('[%s] [master:%s] wroker:%s disconnect, suicide: %s, state: %s.',
      Date(), process.pid, worker.process.pid, worker.suicide, worker.state);
  }).on('exit', function (worker, code, signal) {
    var exitCode = worker.process.exitCode;
    var err = new Error(util.format('worker %s died (code: %s, signal: %s, suicide: %s, state: %s)',
      worker.process.pid, exitCode, signal, worker.suicide, worker.state));
    err.name = 'WorkerDiedError';
    console.error('[%s] [master:%s] wroker exit: %s', Date(), process.pid, err.stack);
  });
}

function forkSyncer() {
  var syncer = childProcess.fork(syncPath);
  syncer.on('exit', function (code, signal) {
    var err = new Error(util.format('syncer %s died (code: %s, signal: %s, stdout: %s, stderr: %s)',
      syncer.pid, code, signal, syncer.stdout, syncer.stderr));
    err.name = 'SyncerWorkerDiedError';
    console.error('[%s] [master:%s] syncer exit: %s: %s',
      Date(), process.pid, err.name, err.message);
    setTimeout(forkSyncer, 1000);
  });
}

function forkScopeSyncer() {
  var syncer = childProcess.fork(scopeSyncPath);
  syncer.on('exit', function (code, signal) {
    var err = new Error(util.format('syncer %s died (code: %s, signal: %s, stdout: %s, stderr: %s)',
      syncer.pid, code, signal, syncer.stdout, syncer.stderr));
    err.name = 'SyncerWorkerDiedError';
    console.error('[%s] [master:%s] syncer exit: %s: %s',
      Date(), process.pid, err.name, err.message);
    setTimeout(forkScopeSyncer, 1000);
  });
}
