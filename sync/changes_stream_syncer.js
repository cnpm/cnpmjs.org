'use strict';

const ChangesStream = require('changes-stream');
const path = require('path');
const fs = require('mz/fs');
const urllib = require('urllib');
const streamAwait = require('await-event');
const logger = require('../common/logger');
const config = require('../config');

const db = config.officialNpmReplicate;
const lastSeqFile = path.join(config.dataDir, '.cnpmjs.org.last_seq.txt');
let _STREAM_ID = 0;

module.exports = function* sync() {
  const pedding = [];
  const since = yield getLastSequence();
  const streamId = _STREAM_ID++;
  let changesCount = 0;
  logger.syncInfo('start changes stream#%d, since: %s', streamId, since);
  const changes = new ChangesStream({
    db,
    since,
    include_docs: false,
  });
  changes.await = streamAwait;
  changes.on('data', change => {
    changesCount++;
    logger.syncInfo('stream#%d get change#%d: %j', streamId, changesCount, change);
    pedding.push(change);
    // syncPackage(change);
  });

  const timer = setInterval(function() {
    for (var i = 0; i < 100; i++) {
      var change = pedding.shift();
      if (!change) {
        break;
      }
      syncPackage(change);
    }
  }, 5000);

  try {
    yield changes.await('error');
  } catch (err) {
    clearInterval(timer);
    // make sure changes steam is destroy
    changes.destroy();
    err.message += `, stream#${streamId}, changesCount#${changesCount}`;
    throw err;
  }
};

function syncPackage(change) {
  const url = `${config.handleSyncRegistry}/${change.id}/sync`;
  urllib.request(`${url}?sync_upstream=true`, {
    method: 'PUT',
    dataType: 'json',
    timeout: 10000,
  }, (err, data) => {
    if (err) {
      logger.syncInfo('%s:%s PUT %s error: %s, retry after 5s',
        change.seq, change.id, url, err);
      logger.syncError(err);
      setTimeout(() => syncPackage(change), 5000);
    } else {
      saveLastSequence(change.seq);
      logger.syncInfo('%s:%s sync request sent, log: %s/log/%s',
        change.seq, change.id, url, data.logId);
    }
  });
}

function* getLastSequence() {
  let lastSeq;
  if (yield fs.exists(lastSeqFile)) {
    lastSeq = yield fs.readFile(lastSeqFile, 'utf8');
    lastSeq = Number(lastSeq);
  }
  if (!lastSeq) {
    lastSeq = 2649694;
  }
  // const r = yield urllib.request(db, {
  //   dataType: 'json',
  //   timeout: 15000,
  // });
  // logger.syncInfo('get registry info: %j', r.data);
  // if (lastSeq < r.data.update_seq) {
  //   lastSeq = r.data.update_seq;
  // }
  return lastSeq;
}

function saveLastSequence(seq) {
  fs.writeFile(lastSeqFile, String(seq), () => {});
}
