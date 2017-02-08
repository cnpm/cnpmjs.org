/**!
 * cnpmjs.org - test/services/module_log.test.js
 *
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const ModuleLog = require('../../services/module_log');

describe('services/module_log.test.js', function() {
  describe('create(), append()', function() {
    it('should create a log row', function* () {
      const log = yield ModuleLog.create({ name: 'utility', username: 'fengmk2' });
      log.id.should.be.a.Number;
      log.log.should.equal('');
    });

    it('should append a log', function* () {
      let log = yield ModuleLog.create({ name: 'module_log-append', username: 'fengmk2' });
      const logid = log.id;

      log = yield ModuleLog.append(logid, 'a new line');
      log.log.should.equal('a new line');
      log = yield ModuleLog.get(logid);
      log.log.should.equal('a new line');

      log = yield ModuleLog.append(logid, 'second line');
      log.log.should.equal('a new line\nsecond line');
      log = yield ModuleLog.get(logid);
      log.log.should.equal('a new line\nsecond line');
    });

    it('should slice log when size bigger than 1MB', function* () {
      let log = yield ModuleLog.create({ name: 'module_log-append', username: 'fengmk2' });
      const logid = log.id;

      const biglog = new Buffer(1024 * 1024).fill(71).toString();
      log = yield ModuleLog.append(logid, biglog);
      log.log.substring(0, 4).should.equal('...\n');
      log.log.length.should.equal(1024 * 1024 / 2 + 4);
    });
  });
});
