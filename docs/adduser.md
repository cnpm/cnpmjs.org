# adduser flow

Server nerver store user password.

* try to add user with salt and password sha1

```
put https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1

json:
   { name: 'cnpmjstest1',
     salt: 'eaafa984aa458aa85ab2e7cc2e27fb453c28aa945b5c090dfdd14766fadd',
     password_sha: 'a1c2b42fbad9fc3455776a1c8c7d7e1dbe05dea7',
     email: 'cnpmjstest1@gmail.com',
     _id: 'org.couchdb.user:cnpmjstest1',
     type: 'user',
     roles: [],
     date: '2013-12-04T13:21:24.232Z' }
```

* if 409, use name and password to get rev

```
409 { error: 'conflict', reason: 'Document update conflict.' }

GET https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
url:
   { protocol: 'https:',
     slashes: true,
     auth: 'cnpmjstest1:cnpmjstest123',
     host: 'registry.npmjs.org',
     port: null,
     hostname: 'registry.npmjs.org',
     hash: null,
     search: null,
     query: null,
     pathname: '/-/user/org.couchdb.user:cnpmjstest1',
     path: '/-/user/org.couchdb.user:cnpmjstest1',
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1' },
=> 200
{"_id":"org.couchdb.user:cnpmjstest1",
"_rev":"1-3b4fcb8f98ddc472badad3357765bbe0","name":"cnpmjstest1",
"email":"cnpmjstest1@gmail.com","type":"user","roles":[],"date":"2013-12-04T13:21:24.232Z"}
```

* if not loggin, couch login first to get AuthSession

```
couch-login: {"uri":"https://registry.npmjs.org/_session","headers":{},"json":true,"body":{"name":"cnpmjstest1","password":"cnpmjstest123"},"method":"post",, statusCode: 200, headers: {"set-cookie":["AuthSession=Y25wbWpzdGVzdDE6NTI5RjJDOUE6ozmDUmLxGZ_mW5pP4PvlNJujnJ4; Version=1; Expires=Wed, 04-Dec-2013 23:22:34 GMT; Max-Age=36000; Path=/; HttpOnly"],"server":"CouchDB/1.5.0 (Erlang OTP/R15B03)","date":"Wed, 04 Dec 2013 13:22:34 GMT","content-type":"application/json","content-length":"44","cache-control":"must-revalidate"}, data: {"ok":true,"name":"cnpmjstest1","roles":[]}
```

* update by rev and AuthSession: https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0

```
PUT https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0
{ url:
   { protocol: 'https:',
     slashes: true,
     auth: null,
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0' },
  method: 'PUT',
  headers:
   { cookie: 'AuthSession=Y25wbWpzdGVzdDE6NTI5RjJDOUE6ozmDUmLxGZ_mW5pP4PvlNJujnJ4',
     accept: 'application/json',
     'user-agent': 'node/v0.10.22 darwin x64' },
  proxy: null,
  json:
   { name: 'cnpmjstest1',
     salt: '61ea2dbef37503ebc82815c2f6e14c5892a584e01825dc198ba9ebccd159',
     password_sha: '714be1807f89ad9442c293c40a972b2dbc479574',
     email: 'cnpmjstest1@gmail.com',
     _id: 'org.couchdb.user:cnpmjstest1',
     type: 'user',
     roles: [],
     date: '2013-12-04T13:22:29.020Z',
     _rev: '1-3b4fcb8f98ddc472badad3357765bbe0' } }
201 { server: 'CouchDB/1.5.0 (Erlang OTP/R15B03)',
  location: 'http://registry.npmjs.org/_users/org.couchdb.user:cnpmjstest1',
  etag: '"2-5f1bb73207a87ce218f3c22be3caf3e1"',
  date: 'Wed, 04 Dec 2013 13:22:36 GMT',
  'content-type': 'application/json',
  'content-length': '91',
  'cache-control': 'must-revalidate' } { ok: true,
  id: 'org.couchdb.user:cnpmjstest1',
  rev: '2-5f1bb73207a87ce218f3c22be3caf3e1' }
```

## adduser first time

```bash
$ npm adduser cnpmjstest1 --verbose
npm info it worked if it ends with ok
npm verb cli [ '/Users/mk2/git/nvm/v0.10.22/bin/node',
npm verb cli   '/Users/mk2/git/nvm/v0.10.22/bin/npm',
npm verb cli   'adduser',
npm verb cli   'cnpmjstest1',
npm verb cli   '--verbose' ]
npm info using npm@1.3.14
npm info using node@v0.10.22
Username: cnpmjstest1
Password:
Email: cnpmjstest1@gmail.com
npm verb adduser before first PUT { name: 'cnpmjstest1',
npm verb adduser   salt: 'XXXXX',
npm verb adduser   password_sha: 'XXXXX',
npm verb adduser   email: 'cnpmjstest1@gmail.com',
npm verb adduser   _id: 'org.couchdb.user:cnpmjstest1',
npm verb adduser   type: 'user',
npm verb adduser   roles: [],
npm verb adduser   date: '2013-12-04T13:21:24.232Z' }
npm verb url raw /-/user/org.couchdb.user:cnpmjstest1
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './-/user/org.couchdb.user:cnpmjstest1' ]
npm verb url resolved https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm info trying registry request attempt 1 at 21:21:24
npm http PUT https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
{ url:
   { protocol: 'https:',
     slashes: true,
     auth: null,
     host: 'registry.npmjs.org',
     port: null,
     hostname: 'registry.npmjs.org',
     hash: null,
     search: null,
     query: null,
     pathname: '/-/user/org.couchdb.user:cnpmjstest1',
     path: '/-/user/org.couchdb.user:cnpmjstest1',
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1' },
  method: 'PUT',
  strictSSL: true,
  headers:
   { accept: 'application/json',
     'user-agent': 'node/v0.10.22 darwin x64' },
  proxy: null,
  json:
   { name: 'cnpmjstest1',
     salt: 'eaafa984aa458aa85ab2e7cc2e27fb453c28aa945b5c090dfdd14766fadd',
     password_sha: 'a1c2b42fbad9fc3455776a1c8c7d7e1dbe05dea7',
     email: 'cnpmjstest1@gmail.com',
     _id: 'org.couchdb.user:cnpmjstest1',
     type: 'user',
     roles: [],
     date: '2013-12-04T13:21:24.232Z' } }
201 { server: 'CouchDB/1.5.0 (Erlang OTP/R15B03)',
  location: 'http://registry.npmjs.org/_users/org.couchdb.user:cnpmjstest1',
  etag: '"1-3b4fcb8f98ddc472badad3357765bbe0"',
  date: 'Wed, 04 Dec 2013 13:21:28 GMT',
  'content-type': 'application/json',
  'content-length': '91',
  'cache-control': 'must-revalidate' } { ok: true,
  id: 'org.couchdb.user:cnpmjstest1',
  rev: '1-3b4fcb8f98ddc472badad3357765bbe0' }
npm http 201 https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm info adduser Authorized user cnpmjstest1
npm verb exit [ 0, true ]
npm info ok
```

## adduser again

```bash
$ npm adduser cnpmjstest1 --verbose
npm info it worked if it ends with ok
npm verb cli [ '/Users/mk2/git/nvm/v0.10.22/bin/node',
npm verb cli   '/Users/mk2/git/nvm/v0.10.22/bin/npm',
npm verb cli   'adduser',
npm verb cli   'cnpmjstest1',
npm verb cli   '--verbose' ]
npm info using npm@1.3.14
npm info using node@v0.10.22
Username: (cnpmjstest1)
Email: (cnpmjstest1@gmail.com)
npm verb adduser before first PUT { name: 'cnpmjstest1',
npm verb adduser   salt: 'XXXXX',
npm verb adduser   password_sha: 'XXXXX',
npm verb adduser   email: 'cnpmjstest1@gmail.com',
npm verb adduser   _id: 'org.couchdb.user:cnpmjstest1',
npm verb adduser   type: 'user',
npm verb adduser   roles: [],
npm verb adduser   date: '2013-12-04T13:22:29.020Z' }
npm verb url raw /-/user/org.couchdb.user:cnpmjstest1
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './-/user/org.couchdb.user:cnpmjstest1' ]
npm verb url resolved https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm info trying registry request attempt 1 at 21:22:29
npm http PUT https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
{ url:
   { protocol: 'https:',
     slashes: true,
     auth: null,
     host: 'registry.npmjs.org',
     port: null,
     hostname: 'registry.npmjs.org',
     hash: null,
     search: null,
     query: null,
     pathname: '/-/user/org.couchdb.user:cnpmjstest1',
     path: '/-/user/org.couchdb.user:cnpmjstest1',
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1' },
  method: 'PUT',
  headers:
   { accept: 'application/json',
     'user-agent': 'node/v0.10.22 darwin x64' },
  proxy: null,
  json:
   { name: 'cnpmjstest1',
     salt: '61ea2dbef37503ebc82815c2f6e14c5892a584e01825dc198ba9ebccd159',
     password_sha: '714be1807f89ad9442c293c40a972b2dbc479574',
     email: 'cnpmjstest1@gmail.com',
     _id: 'org.couchdb.user:cnpmjstest1',
     type: 'user',
     roles: [],
     date: '2013-12-04T13:22:29.020Z' } }
409 { server: 'CouchDB/1.5.0 (Erlang OTP/R15B03)',
  date: 'Wed, 04 Dec 2013 13:22:31 GMT',
  'content-type': 'application/json',
  'content-length': '58',
  'cache-control': 'must-revalidate' } { error: 'conflict', reason: 'Document update conflict.' }
npm http 409 https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm verb adduser update existing user
npm verb url raw /-/user/org.couchdb.user:cnpmjstest1
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './-/user/org.couchdb.user:cnpmjstest1' ]
npm verb url resolved https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm info trying registry request attempt 1 at 21:22:31
npm http GET https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
{ url:
   { protocol: 'https:',
     slashes: true,
     auth: 'cnpmjstest1:cnpmjstest123',
     host: 'registry.npmjs.org',
     port: null,
     hostname: 'registry.npmjs.org',
     hash: null,
     search: null,
     query: null,
     pathname: '/-/user/org.couchdb.user:cnpmjstest1',
     path: '/-/user/org.couchdb.user:cnpmjstest1',
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1' },
  method: 'GET',
  headers:
   { accept: 'application/json',
     'user-agent': 'node/v0.10.22 darwin x64' },
  proxy: null }
200 { server: 'CouchDB/1.3.1 (Erlang OTP/R15B03)',
  etag: '"1-3b4fcb8f98ddc472badad3357765bbe0"',
  date: 'Wed, 04 Dec 2013 13:22:33 GMT',
  'content-type': 'application/json',
  'content-length': '195',
  'cache-control': 'must-revalidate' } '{"_id":"org.couchdb.user:cnpmjstest1","_rev":"1-3b4fcb8f98ddc472badad3357765bbe0","name":"cnpmjstest1","email":"cnpmjstest1@gmail.com","type":"user","roles":[],"date":"2013-12-04T13:21:24.232Z"}\n'
npm http 200 https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1
npm verb adduser userobj { name: 'cnpmjstest1',
npm verb adduser   salt: 'XXXXX',
npm verb adduser   password_sha: 'XXXXX',
npm verb adduser   email: 'cnpmjstest1@gmail.com',
npm verb adduser   _id: 'org.couchdb.user:cnpmjstest1',
npm verb adduser   type: 'user',
npm verb adduser   roles: [],
npm verb adduser   date: '2013-12-04T13:22:29.020Z' }
npm verb url raw /-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0
npm verb url resolving [ 'https://registry.npmjs.org/',
npm verb url resolving   './-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0' ]
npm verb url resolved https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0
couch-login: {"uri":"https://registry.npmjs.org/_session","headers":{},"json":true,"body":{"name":"cnpmjstest1","password":"cnpmjstest123"},"method":"post",, statusCode: 200, headers: {"set-cookie":["AuthSession=Y25wbWpzdGVzdDE6NTI5RjJDOUE6ozmDUmLxGZ_mW5pP4PvlNJujnJ4; Version=1; Expires=Wed, 04-Dec-2013 23:22:34 GMT; Max-Age=36000; Path=/; HttpOnly"],"server":"CouchDB/1.5.0 (Erlang OTP/R15B03)","date":"Wed, 04 Dec 2013 13:22:34 GMT","content-type":"application/json","content-length":"44","cache-control":"must-revalidate"}, data: {"ok":true,"name":"cnpmjstest1","roles":[]}
npm info trying registry request attempt 1 at 21:22:34
npm http PUT https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0
{ url:
   { protocol: 'https:',
     slashes: true,
     auth: null,
     host: 'registry.npmjs.org',
     port: null,
     hostname: 'registry.npmjs.org',
     hash: null,
     search: null,
     query: null,
     pathname: '/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0',
     path: '/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0',
     href: 'https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0' },
  method: 'PUT',
  headers:
   { cookie: 'AuthSession=Y25wbWpzdGVzdDE6NTI5RjJDOUE6ozmDUmLxGZ_mW5pP4PvlNJujnJ4',
     accept: 'application/json',
     'user-agent': 'node/v0.10.22 darwin x64' },
  proxy: null,
  json:
   { name: 'cnpmjstest1',
     salt: '61ea2dbef37503ebc82815c2f6e14c5892a584e01825dc198ba9ebccd159',
     password_sha: '714be1807f89ad9442c293c40a972b2dbc479574',
     email: 'cnpmjstest1@gmail.com',
     _id: 'org.couchdb.user:cnpmjstest1',
     type: 'user',
     roles: [],
     date: '2013-12-04T13:22:29.020Z',
     _rev: '1-3b4fcb8f98ddc472badad3357765bbe0' } }
201 { server: 'CouchDB/1.5.0 (Erlang OTP/R15B03)',
  location: 'http://registry.npmjs.org/_users/org.couchdb.user:cnpmjstest1',
  etag: '"2-5f1bb73207a87ce218f3c22be3caf3e1"',
  date: 'Wed, 04 Dec 2013 13:22:36 GMT',
  'content-type': 'application/json',
  'content-length': '91',
  'cache-control': 'must-revalidate' } { ok: true,
  id: 'org.couchdb.user:cnpmjstest1',
  rev: '2-5f1bb73207a87ce218f3c22be3caf3e1' }
npm http 201 https://registry.npmjs.org/-/user/org.couchdb.user:cnpmjstest1/-rev/1-3b4fcb8f98ddc472badad3357765bbe0
npm info adduser Authorized user cnpmjstest1
npm verb exit [ 0, true ]
npm info ok
```
