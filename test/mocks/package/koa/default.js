var config = require('../../../../config')
module.exports = {
  title: 'Package - koa',
  package: {
    name: 'koa',
    version: '0.13.0',
    description: 'description: Koa web app framework',
    registryUrl: 'https://registry.npm.taobao.org/koa',
    engines: {
      node: {
        version: '>= 0.11.13',
        title: 'node: >=0.11.13',
        badgeURL: config.badgePrefixURL + '/badge/node-%3E%3D%200.11.13-red.svg?style=flat-square',
      }
    },
    _publish_on_cnpm: false,
    preferGlobal: false,
    fromNow: 'a month ago',
    lastPublishedUser: {
      name: 'dead-horse'
    },
    license: {
      name: 'MIT',
      url: 'http://opensource.org/licenses/MIT'
    },
    repository: {
      weburl: 'https://github.com/koajs/koa',
    },
    bugs: {
      url: 'https://github.com/koajs/koa/issues'
    },
    dependencies: {
      accepts: '^1.1.0',
      co: '^3.1.0',
      'content-disposition': '~0.3.0',
      cookies: '~0.5.0',
      debug: '*',
      delegates: '0.0.3',
      destroy: '^1.0.3',
      'error-inject': '~1.0.0',
      'escape-html': '~1.0.1',
      fresh: '~0.2.1',
      'http-assert': '^1.0.1',
      'http-errors': '^1.2.0',
      'koa-compose': '^2.3.0',
      'koa-is-json': '^1.0.0',
      'media-typer': '~0.3.0',
      'mime-types': '^2.0.0',
      'on-finished': '^2.1.0',
      only: '0.0.2',
      parseurl: '^1.3.0',
      statuses: '^1.1.0',
      'type-is': '^1.5.0',
      vary: '^1.0.0'
    },
    devDependencies: {
      'istanbul-harmony': '~0.3.0',
      'make-lint': '^1.0.1',
      mocha: '^1.17.0',
      should: '^3.1.0',
      supertest: '~0.13.0',
      'test-console': '^0.7.1'
    },
    dependents: [
      'cnpmjs.org',
      'koa-project',
    ],
    maintainers: [
      {
        name: 'fengmk2',
        gravatar: 'https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
      },
      {
        name: 'jongleberry',
        gravatar: 'https://secure.gravatar.com/avatar/6e33cc0412b61cc01daac23c8989003c?s=50&d=retro',
      },
      {
        name: 'dead_horse',
        gravatar: 'https://secure.gravatar.com/avatar/2e7cc21dde5f4e944eefff64bde07136?s=50&d=retro',
      },
      {
        name: 'fengmk2',
        gravatar: 'https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
      },
      {
        name: 'jongleberry',
        gravatar: 'https://secure.gravatar.com/avatar/6e33cc0412b61cc01daac23c8989003c?s=50&d=retro',
      },
      {
        name: 'dead_horse',
        gravatar: 'https://secure.gravatar.com/avatar/2e7cc21dde5f4e944eefff64bde07136?s=50&d=retro',
      },
      {
        name: 'fengmk2',
        gravatar: 'https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro',
      },
      {
        name: 'jongleberry',
        gravatar: 'https://secure.gravatar.com/avatar/6e33cc0412b61cc01daac23c8989003c?s=50&d=retro',
      },
      {
        name: 'dead_horse',
        gravatar: 'https://secure.gravatar.com/avatar/2e7cc21dde5f4e944eefff64bde07136?s=50&d=retro',
      },
    ],
    readme: readme(),
  },
  download: {
    today: 100,
    thisweek: 700,
    thismonth: 3000,
    lastday: 100,
    lastweek: 800,
    lastmonth: 4000,
  },
  __view: 'package'
};

function readme() {
  var markdown = require('../../../../common/markdown');
  var fs = require('fs');
  var path = require('path');
  return markdown.render(fs.readFileSync(path.join(__dirname, 'readme.md'), 'utf8'));
}
