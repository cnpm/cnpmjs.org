'use strict';

const ChangesStream = require('changes-stream');
const path = require('path');
const fs = require('mz/fs');
const os = require('os');
const urllib = require('urllib');
const streamAwait = require('await-event')
const logger = require('../common/logger');
const config = require('../config');

const db = 'https://replicate.npmjs.com';
const lastSeqFile = path.join(config.dataDir, '.cnpmjs.org.last_seq.txt');

module.exports = function* sync() {
  const since = yield getLastSequence();
  logger.syncInfo('start changes stream, since: %s', since);
  const changes = new ChangesStream({
    db,
    since,
    include_docs: false,
  });
  changes.await = streamAwait;
  changes.on('data', change => {
    logger.syncInfo('Get change: %j', change);
    syncPackage(change);
  });

  yield changes.await('error');
};

function syncPackage(change) {
  const url = `${config.handleSyncRegistry}/${change.id}/sync`;
  urllib.request(url, {
    method: 'PUT',
    dataType: 'json',
    timeout: 10000,
  }, (err, data, res) => {
    if (err) {
      logger.syncInfo('%s:%s PUT %s error: %s, retry after 5s',
        change.seq, change.id, url, err);
      logger.syncError(err);
      syncPackage(change);
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
    lastSeq = 2614765;
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
