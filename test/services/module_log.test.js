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

var ModuleLog = require('../../services/module_log');

describe('proxy/module_log.test.js', function () {
  describe('create(), append()', function () {
    it('should create a log row', function* () {
      var log = yield* ModuleLog.create({name: 'utility', username: 'fengmk2'});
      log.id.should.be.a.Number;
      log.log.should.equal('');
    });

    it('should append a log', function* () {
      var log = yield* ModuleLog.create({name: 'module_log-append', username: 'fengmk2'});
      var logid = log.id;

      log = yield* ModuleLog.append(logid, 'a new line');
      log.log.should.equal('\na new line');
      log = yield* ModuleLog.get(logid);
      log.log.should.equal('\na new line');

      log = yield* ModuleLog.append(logid, 'second line');
      log.log.should.equal('\na new line\nsecond line');
      log = yield* ModuleLog.get(logid);
      log.log.should.equal('\na new line\nsecond line');
    });
  });
});
