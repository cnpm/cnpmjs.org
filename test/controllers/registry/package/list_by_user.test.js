/**!
 * Copyright(c) cnpmjs.org and other contributors.
 * MIT Licensed
 *
 * Authors:
 *  fengmk2 <fengmk2@gmail.com> (http://fengmk2.com)
 */

'use strict';

/**
 * Module dependencies.
 */

const request = require('supertest');
const mm = require('mm');
const should = require('should');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/registry/package/list_by_user.test.js', function() {
  const user = 'cnpmjstest_list_by_user';
  const userauth = 'Basic ' + new Buffer(user + ':' + user).toString('base64');

  afterEach(mm.restore);

  before(function(done) {
    const pkg = utils.getPackage('@cnpmtest/list_by_user_module1', '1.0.1', user);
    request(app)
    .put('/' + pkg.name)
    .set('authorization', userauth)
    .send(pkg)
    .expect(201, function(err) {
      should.not.exist(err);

      const pkg2 = utils.getPackage('@cnpmtest/list_by_user_module2', '2.0.0', user);
      request(app)
      .put('/' + pkg2.name)
      .set('authorization', userauth)
      .send(pkg2)
      .expect(201, done);
    });
  });

  describe('GET /-/users/:user/packages', function() {
    it('should get 200', function(done) {
      const url = '/-/users/' + user + '/packages';
      request(app)
      .get(url)
      .expect(function(res) {
        const data = res.body;
        data.user.name.should.equal(user);
        const map = {};
        data.packages.forEach(function(pkg) {
          map[pkg.name] = pkg;
        });
        map['@cnpmtest/list_by_user_module1'].should.be.an.Object;
        map['@cnpmtest/list_by_user_module1'].should.eql({
          name: '@cnpmtest/list_by_user_module1',
          description: '',
          version: '1.0.1',
        });

        map['@cnpmtest/list_by_user_module2'].should.be.an.Object;
        map['@cnpmtest/list_by_user_module2'].should.eql({
          name: '@cnpmtest/list_by_user_module2',
          description: '',
          version: '2.0.0',
        });
      })
      .expect(200, done);
    });

    it('should get empty packages list when user not exists', function(done) {
      const url = '/-/users/not-exist-username/packages';
      request(app)
      .get(url)
      .expect({
        user: {
          name: 'not-exist-username',
        },
        packages: [],
      })
      .expect(200, done);
    });
  });
});
