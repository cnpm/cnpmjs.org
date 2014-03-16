# npm publish flow

## Flows

1. try to put package.json and tgz, maybe base64 tgz body
2. if new version not exists, publish success
3. if new version exists, 409, try to get full package info with ?write=true
4. if new version had publish, show: "Update the 'version' field in package.json and try again."

```bash
$ cnpm publish
npm http PUT http://r.cnpmjs.org/cnpmjs.org
npm http 409 http://r.cnpmjs.org/cnpmjs.org
npm http GET http://r.cnpmjs.org/cnpmjs.org?write=true
npm http 200 http://r.cnpmjs.org/cnpmjs.org?write=true
npm ERR! publish fail Cannot publish over existing version.
npm ERR! publish fail Update the 'version' field in package.json and try again.
```

## Details

code: https://github.com/isaacs/npm-registry-client/blob/master/lib/publish.js

* couch login if token not exists: [couch-login](https://github.com/isaacs/couch-login)

```js
if (authRequired && !this.conf.get('always-auth')) {
    var couch = this.couchLogin
    , token = couch && (this.conf.get('_token') || couch.token)
    , validToken = token && couch.valid(token)

    if (!validToken) token = null
    else this.conf.set('_token', token)

    if (couch && !token) {
      // login to get a valid token
      var a = { name: this.conf.get('username'),
                password: this.conf.get('_password') }
      var args = arguments
      return this.couchLogin.login(a, function (er, cr, data) {
        if (er || !couch.valid(couch.token)) {
          er = er || new Error('login error')
          return cb(er, cr, data)
        }
        this.conf.set('_token', this.couchLogin.token)
        return regRequest.call(this,
                               method, where, what,
                               etag, nofollow, reauthed, cb_)
      }.bind(this))
    }
  }
```

* put full data with AuthSession to `https://registry.npmjs.org/packagename`

```
var fullData =
    { _id : data.name
    , name : data.name
    , description : data.description
    , "dist-tags" : {}
    , versions : {}
    , readme: data.readme || ""
    , maintainers :
      [ { name : username
        , email : email
        }
      ]
    }


npm http PUT https://registry.npmjs.org/cnpmjs.org
npm http 201 https://registry.npmjs.org/cnpmjs.org
```

* 409 or 201

```
{ error: 'conflict', reason: 'Document update conflict.' }
```

* get data (with auth header) to check exists versions

```
npm http GET https://registry.npmjs.org/cnpmjs.org
```

* put tarball

```
npm http PUT https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm http 201 https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm verb publish attached [ 'cnpmjs.org',
npm verb publish   '/Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz',
npm verb publish   'cnpmjs.org-0.0.0.tgz' ]
```

* put data to dataURI

```
data._id = data.name+"@"+data.version
data.dist = data.dist || {}
data.dist.tarball = url.resolve(registry, tbURI)
                       .replace(/^https:\/\//, "http://")
var dataURI = encodeURIComponent(data.name)
            + "/" + encodeURIComponent(data.version)

var tag = data.tag || this.conf.get('tag') || "latest"
dataURI += "/-tag/" + tag

npm http PUT https://registry.npmjs.org/cnpmjs.org/0.0.0/-tag/latest
npm http 201 https://registry.npmjs.org/cnpmjs.org/0.0.0/-tag/latest
```

## publish log

```bash
$ npm --verbose publish
npm info it worked if it ends with ok
npm verb cli [ '/Users/mk2/git/nvm/v0.10.22/bin/node',
npm verb cli   '/Users/mk2/git/nvm/v0.10.22/bin/npm',
npm verb cli   '--verbose',
npm verb cli   'publish' ]
npm info using npm@1.3.14
npm info using node@v0.10.22
npm verb publish [ '.' ]
npm verb cache add [ '.', null ]
npm verb cache add name=undefined spec="." args=[".",null]
npm verb parsed url { protocol: null,
npm verb parsed url   slashes: null,
npm verb parsed url   auth: null,
npm verb parsed url   host: null,
npm verb parsed url   port: null,
npm verb parsed url   hostname: null,
npm verb parsed url   hash: null,
npm verb parsed url   search: null,
npm verb parsed url   query: null,
npm verb parsed url   pathname: '.',
npm verb parsed url   path: '.',
npm verb parsed url   href: '.' }
npm verb lock . /Users/mk2/.npm/3a52ce78-.lock
npm verb tar pack [ '/var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/tmp.tgz',
npm verb tar pack   '.' ]
npm verb tarball /var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/tmp.tgz
npm verb folder .
npm info prepublish cnpmjs.org@0.0.0
npm verb lock tar://. /Users/mk2/.npm/1f1177db-tar.lock
npm verb lock tar:///var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/tmp.tgz /Users/mk2/.npm/514cb318-99490-0-4191121745388955-tmp-tgz.lock
npm verb tar unpack /var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/tmp.tgz
npm verb lock tar:///var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/package /Users/mk2/.npm/b551207f-99490-0-4191121745388955-package.lock
npm verb lock tar:///var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/tmp.tgz /Users/mk2/.npm/514cb318-99490-0-4191121745388955-tmp-tgz.lock
npm verb tar pack [ '/Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz',
npm verb tar pack   '/var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/package' ]
npm verb tarball /Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz
npm verb folder /var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/package
npm verb lock tar:///var/folders/16/zt6163qd0b93185_stkvm63h0000gp/T/npm-45424-z6gnaa-Z/1386064699490-0.4191121745388955/package /Users/mk2/.npm/b551207f-99490-0-4191121745388955-package.lock
npm verb lock tar:///Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz /Users/mk2/.npm/f79b8193-npm-cnpmjs-org-0-0-0-package-tgz.lock
npm verb lock /Users/mk2/.npm/cnpmjs.org/0.0.0/package /Users/mk2/.npm/d61eb4cc-mk2-npm-cnpmjs-org-0-0-0-package.lock
npm verb tar unpack /Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz
npm verb lock tar:///Users/mk2/.npm/cnpmjs.org/0.0.0/package /Users/mk2/.npm/897986a1-mk2-npm-cnpmjs-org-0-0-0-package.lock
npm verb lock tar:///Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz /Users/mk2/.npm/f79b8193-npm-cnpmjs-org-0-0-0-package-tgz.lock
npm verb chmod /Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz 644
npm verb chown /Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz [ 502, 20 ]
npm verb url raw cnpmjs.org
npm verb url resolving [ 'https://registry.npmjs.org/', './cnpmjs.org' ]
npm verb url resolved https://registry.npmjs.org/cnpmjs.org
npm info trying registry request attempt 1 at 17:58:19
npm http PUT https://registry.npmjs.org/cnpmjs.org
npm http 201 https://registry.npmjs.org/cnpmjs.org
npm verb url raw cnpmjs.org
npm verb url resolving [ 'https://registry.npmjs.org/', './cnpmjs.org' ]
npm verb url resolved https://registry.npmjs.org/cnpmjs.org
npm info trying registry request attempt 1 at 17:58:20
npm http GET https://registry.npmjs.org/cnpmjs.org
npm http 200 https://registry.npmjs.org/cnpmjs.org
npm verb uploading [ 'cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e',
npm verb uploading   '/Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz' ]
npm verb url raw cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e' ]
npm verb url resolved https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm info trying registry request attempt 1 at 17:58:22
npm http PUT https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm http 201 https://registry.npmjs.org/cnpmjs.org/-/cnpmjs.org-0.0.0.tgz/-rev/1-c85bc65e8d2470cc4d82b8f40da65b8e
npm verb publish attached [ 'cnpmjs.org',
npm verb publish   '/Users/mk2/.npm/cnpmjs.org/0.0.0/package.tgz',
npm verb publish   'cnpmjs.org-0.0.0.tgz' ]
npm verb url raw cnpmjs.org/0.0.0/-tag/latest
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './cnpmjs.org/0.0.0/-tag/latest' ]
npm verb url resolved https://registry.npmjs.org/cnpmjs.org/0.0.0/-tag/latest
npm info trying registry request attempt 1 at 17:58:23
npm http PUT https://registry.npmjs.org/cnpmjs.org/0.0.0/-tag/latest
npm http 201 https://registry.npmjs.org/cnpmjs.org/0.0.0/-tag/latest
+ cnpmjs.org@0.0.0
npm info publish cnpmjs.org@0.0.0
npm info postpublish cnpmjs.org@0.0.0
npm verb exit [ 0, true ]
npm info ok
```
