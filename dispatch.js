'use strict';

const childProcess = require('child_process');
const path = require('path');
const util = require('util');
const cfork = require('cfork');
const config = require('./config');
const workerPath = path.join(__dirname, 'worker.js');
const syncPath = path.join(__dirname, 'sync');

console.log('Starting cnpmjs.org ...\ncluster: %s\nadmins: %j\nscopes: %j\nsourceNpmRegistry: %s\nsyncModel: %s',
  config.enableCluster, config.admins, config.scopes, config.sourceNpmRegistry, config.syncModel);

if (config.enableCluster) {
  forkWorker();
  if (config.syncModel !== 'none') {
    forkSyncer();
  }
} else {
  require(workerPath);
  if (config.syncModel !== 'none') {
    require(syncPath);
  }
}

function forkWorker() {
  cfork({
    exec: workerPath,
    count: config.numCPUs,
  })
  .on('fork', worker => {
    console.log('[%s] [worker:%d] new worker start', Date(), worker.process.pid);
  })
  .on('disconnect', worker => {
    console.error('[%s] [master:%s] wroker:%s disconnect, suicide: %s, state: %s.',
      Date(), process.pid, worker.process.pid, worker.suicide, worker.state);
  })
  .on('exit', (worker, code, signal) => {
    const exitCode = worker.process.exitCode;
    const err = new Error(util.format('worker %s died (code: %s, signal: %s, suicide: %s, state: %s)',
      worker.process.pid, exitCode, signal, worker.suicide, worker.state));
    err.name = 'WorkerDiedError';
    console.error('[%s] [master:%s] wroker exit: %s', Date(), process.pid, err.stack);
  });
}

function forkSyncer() {
  const syncer = childProcess.fork(syncPath);
  syncer.on('exit', (code, signal) => {
    const err = new Error(util.format('syncer %s died (code: %s, signal: %s, stdout: %s, stderr: %s)',
      syncer.pid, code, signal, syncer.stdout, syncer.stderr));
    err.name = 'SyncerWorkerDiedError';
    console.error('[%s] [master:%s] syncer exit: %s: %s',
      Date(), process.pid, err.name, err.message);
    setTimeout(forkSyncer, 1000);
  });
}
