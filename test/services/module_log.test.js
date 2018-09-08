'use strict';

var ModuleLog = require('../../services/module_log');

describe('test/services/module_log.test.js', () => {
  describe('create(), append()', () => {
    it('should create a log row', function* () {
      var log = yield ModuleLog.create({name: 'utility', username: 'fengmk2'});
      log.id.should.be.a.Number;
      log.log.should.equal('');
    });

    it('should append a log', function* () {
      var log = yield ModuleLog.create({name: 'module_log-append', username: 'fengmk2'});
      var logid = log.id;

      log = yield ModuleLog.append(logid, 'a new line');
      log.log.should.equal('a new line');
      log = yield ModuleLog.get(logid);
      log.log.should.equal('a new line');

      log = yield ModuleLog.append(logid, 'second line');
      log.log.should.equal('a new line\nsecond line');
      log = yield ModuleLog.get(logid);
      log.log.should.equal('a new line\nsecond line');
    });

    it('should slice log when size bigger than 50kb', function* () {
      var log = yield ModuleLog.create({name: 'module_log-append', username: 'fengmk2'});
      var logid = log.id;

      var biglog = Buffer.alloc(50 * 1024 + 1).fill(71).toString();
      log = yield ModuleLog.append(logid, biglog);
      log.log.substring(1023, 1024 + 27).should.equal('G\n... ignore long logs ...\nG');
      log.log.length.should.equal(50 * 1024 + 26 + 1024);
    });

    it('should slice log when size equal 50kb', function* () {
      var log = yield ModuleLog.create({name: 'module_log-append', username: 'fengmk2'});
      var logid = log.id;

      var biglog = Buffer.alloc(50 * 1024).fill(71).toString();
      log = yield ModuleLog.append(logid, biglog);
      log.log.substring(0, 4).should.equal('GGGG');
      log.log.length.should.equal(50 * 1024);
    });
  });
});
