'ues strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  registry: 'https://r.cnpmjs.org',
  exclude: [
    'test/fixtures',
    'examples',
    'docs',
    'public',
  ],
  dep: [
    'mysql',
    'egg',
    'koa-router',
  ],
  devdep: [
    'autod',
    'autod-egg',
    'eslint',
    'eslint-config-egg',
    'egg-bin',
    'egg-mock',
  ],
  keep: [
  ],
  semver: [
    'changes-stream@1',
    'nodemailer@1',
    'koa-router@3',
    'supertest@2',
  ],
};
