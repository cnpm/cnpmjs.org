'use strict';

var should = require('should');
var request = require('supertest');
var pedding = require('pedding');
var app = require('../../../servers/registry');
var utils = require('../../utils');

describe('test/controllers/registry/audit.test.js', function () {
  it('should get /-/npm/v1/security/audits', function (done) {
    var reqBody = {
      "name": "demo-npm",
      "version": "1.0.0",
      "requires": {
        "minimatch": "^1.0.0",
        "moment": "^2.10.5"
      },
      "dependencies": {
        "lru-cache": {
          "version": "2.7.3",
          "integrity": "sha1-bUUk6LlV+V1PW1iFHOId1y+06VI="
        },
        "minimatch": {
          "version": "1.0.0",
          "integrity": "sha1-4N0hILSeG3JM6NcUxSCCKpQ4V20=",
          "requires": {
            "lru-cache": "2",
            "sigmund": "~1.0.0"
          }
        },
        "moment": {
          "version": "2.22.1",
          "integrity": "sha512-shJkRTSebXvsVqk56I+lkb2latjBs8I+pc2TzWc545y2iFnSjm7Wg0QMh+ZWcdSLQyGEau5jI8ocnmkyTgr9YQ=="
        },
        "sigmund": {
          "version": "1.0.1",
          "integrity": "sha1-P\/IfGYytIXX587eBhT\/ZTQ0ZtZA="
        }
      },
      "install": [

      ],
      "remove": [

      ],
      "metadata": {
        "npm_version": "6.0.1",
        "node_version": "v8.11.2",
        "platform": "win32"
      }
    };
    request(app)
      .post('/-/npm/v1/security/audits')
      .send(reqBody)
      .expect(200, done);
  })

  it('should get /-/npm/v1/security/audits/quick', function (done) {
    var reqBody = {
      "name": "demo-npm",
      "version": "1.0.0",
      "requires": {
        "moment": "^2.10.5",
        "minimatch": "^1.0.0"
      },
      "dependencies": {
        "lru-cache": {
          "version": "2.7.3",
          "integrity": "sha1-bUUk6LlV+V1PW1iFHOId1y+06VI="
        },
        "minimatch": {
          "version": "1.0.0",
          "integrity": "sha1-4N0hILSeG3JM6NcUxSCCKpQ4V20=",
          "requires": {
            "lru-cache": "2",
            "sigmund": "~1.0.0"
          }
        },
        "moment": {
          "version": "2.22.1",
          "integrity": "sha512-shJkRTSebXvsVqk56I+lkb2latjBs8I+pc2TzWc545y2iFnSjm7Wg0QMh+ZWcdSLQyGEau5jI8ocnmkyTgr9YQ=="
        },
        "sigmund": {
          "version": "1.0.1",
          "integrity": "sha1-P\/IfGYytIXX587eBhT\/ZTQ0ZtZA="
        }
      },
      "install": [
        "minimatch@1.0.0"
      ],
      "remove": [

      ],
      "metadata": {
        "npm_version": "6.0.1",
        "node_version": "v8.11.2",
        "platform": "win32"
      }
    }
    request(app)
      .post('/-/npm/v1/security/audits/quick')
      .send(reqBody)
      .expect(200, function (err, res) {
        res.body.metadata.should.Object()
        done();
      });
  })
});
