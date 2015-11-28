/**!
 * cnpmjs.org - test/services/user.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   ibigbug <xiaobayuwei@gmail.com>
 */

'use strict';

/**
 * Module dependencies.
 */

let should = require('should');
let mm = require('mm');
let config = require('../../config');
let service = require('../../services/user');

describe('services/user.test.js', function () {
  describe('userList()', function () {
    it('should query userList with page, pageSize, searchConditoin', function*() {

      let userList = yield* service.userList(2, 5, '');

      userList.should.be.instanceOf(Object);
      userList.should.have.property('pagination');
      userList.should.have.property('rows');

      let rows = userList.rows;
      rows.should.be.instanceOf(Array);
      rows.should.have.lengthOf(5);

      let pagination = userList.pagination;
      pagination.should.be.instanceOf(Object);
      pagination.should.have.property('current');
      pagination.should.have.property('total');
    });

    it('should response unusual request', function* () {
      let userList = yield* service.userList(10000, 5000, 'what ever');
      userList.should.be.instanceOf(Object);
      userList.should.have.property('pagination');
      userList.should.have.property('rows');

      let rows = userList.rows;
      rows.should.be.instanceOf(Array)
      rows.should.have.lengthOf(0);

      let pagination = userList.pagination;
      pagination.should.be.instanceOf(Object)
      pagination.should.have.property('current');
      pagination.should.have.property('total');
    })
  })
})
