'use strict';

const pedding = require('pedding');
const should = require('should');
const request = require('supertest');
const mm = require('mm');
const config = require('../../../../config');
const app = require('../../../../servers/registry');
const utils = require('../../../utils');

describe('test/controllers/registry/package/list_shorts.test.js', () => {
  afterEach(mm.restore);

  before(done => {
    done = pedding(2, done);
    const pkg = utils.getPackage('@cnpmtest/testmodule-list-shorts1', '1.0.0', utils.admin);
    pkg.versions['1.0.0'].dependencies = {
      '@cnpmtest/testmodule-list-shorts2': '~1.0.0',
    };
    request(app.listen())
    .put('/' + pkg.name)
    .set('authorization', utils.adminAuth)
    .send(pkg)
    .expect(201, done);

    const pkg2 = utils.getPackage('@cnpmtest/testmodule-list-shorts2', '1.0.0', utils.admin);
    request(app.listen())
    .put('/' + pkg2.name)
    .set('authorization', utils.adminAuth)
    .send(pkg2)
    .expect(201, done);
  });

  before(done => {
    mm(config, 'syncModel', 'all');
    utils.sync('pedding', done);
  });

  describe('GET /-/short', () => {
    it('should get 200', done => {
      request(app)
      .get('/-/short')
      .expect(200, (err, res) => {
        should.not.exist(err);
        res.body.should.be.an.Array;
        res.body.length.should.above(0);
        res.body.indexOf('pedding').should.above(-1);
        done();
      });
    });

    it('should list private packages only', done => {
      request(app)
      .get('/-/short?private_only=true')
      .expect(200, (err, res) => {
        should.not.exist(err);
        res.body.should.be.an.Array;
        res.body.length.should.above(0);
        res.body.indexOf('@cnpmtest/testmodule-list-shorts1').should.above(-1);
        done();
      });
    });
  });
});
