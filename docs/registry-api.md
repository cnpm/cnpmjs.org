# NPM Registry API

## Overview

* [Schema](/docs/registry-api.md#schema)
* [Client Errors](/docs/registry-api.md#client-errors)
* [Authentication](/docs/registry-api.md#authentication)
* [Package](/docs/registry-api.md#package)
* [User](/docs/registry-api.md#user)
* [Search](/docs/registry-api.md#search)

## Schema

All API access is over HTTPS or HTTP,
and accessed from the `registry.npmjs.org` domain.
All data is sent and received as JSON.

```bash
$ curl -i https://registry.npmjs.org

HTTP/1.1 200 OK
Date: Tue, 05 Aug 2014 10:53:24 GMT
Server: CouchDB/1.5.0 (Erlang OTP/R16B03)
Content-Type: text/plain; charset=utf-8
Cache-Control: max-age=60
Content-Length: 258
Accept-Ranges: bytes
Via: 1.1 varnish
Age: 11
X-Served-By: cache-ty67-TYO
X-Cache: HIT
X-Cache-Hits: 1
X-Timer: S1407236004.867906,VS0,VE0

{"db_name":"registry","doc_count":90789,"doc_del_count":381,"update_seq":137250,"purge_seq":0,
"compact_running":false,"disk_size":436228219,"data_size":332875061,
"instance_start_time":"1405721973718703","disk_format_version":6,"committed_update_seq":137250}
```

## Client Errors

```json
Status: 4xx

{
  "error": "error_name",
  "reason": "error reason string"
}
```

## Authentication

There is only one way to authenticate through the API.

## Basic Authentication

```bash
$ curl -u "username:password" https://registry.npmjs.org
```

## Failed login limit

```bash
$ curl -i -X PUT -u foo:pwd \
  -d '{"name":"foo","email":"foo@bar.com","type":"user","roles":[]}' \
  https://registry.npmjs.org/-/user/org.couchdb.user:foo/-rev/11-d226c6afa9286ab5b9eb858c429bdabf

HTTP/1.1 401 Unauthorized
Date: Tue, 05 Aug 2014 15:33:25 GMT
Server: CouchDB/1.5.0 (Erlang OTP/R14B04)
Content-Type: text/plain; charset=utf-8
Cache-Control: max-age=60
Content-Length: 67
Accept-Ranges: bytes
Via: 1.1 varnish
X-Served-By: cache-ty66-TYO
X-Cache: MISS
X-Cache-Hits: 0
X-Timer: S1407252805.261390,VS0,VE434

{"error":"unauthorized","reason":"Name or password is incorrect."}
```

## Package

* Read
  * [Get a single package](/docs/registry-api.md#get-a-single-package)
  * [Get a special version or tag package](/docs/registry-api.md#get-a-special-version-or-tag-package)
  * [List packages since from a update time](/docs/registry-api.md#list-packages-since-from-a-update-time)
* Write
  * [Publish a new package](/docs/registry-api.md#publish-a-new-package)
  * [Update a package's tag](/docs/registry-api.md#update-a-packages-tag)
  * [Update a package's maintainers](/docs/registry-api.md#update-a-packages-maintainers)
  * [Remove one version from package](/docs/registry-api.md#remove-one-version-from-package)
  * [Remove a tgz file from package](/docs/registry-api.md#remove-a-tgz-file-from-package)

### Get a single package

```
GET /:package
```

#### Response

```json
HTTP/1.1 200 OK
Etag: "8UDCP753LFXOG42NMX88JAN40"
Content-Type: application/json
Cache-Control: max-age=60
Content-Length: 2243

{
  "_id": "pedding",
  "_rev": "11-e6d1e6e96eaf72433fef6aaabe843af8",
  "name": "pedding",
  "description": "Just pedding for callback.",
  "dist-tags": {
    "latest": "1.0.0"
  },
  "versions": {
    "1.0.0": {
      "name": "pedding",
      "version": "1.0.0",
      "description": "Just pedding for callback.",
      "main": "index.js",
      "scripts": {
        "test": "make test-all"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/fengmk2/pedding.git"
      },
      "keywords": [
        "pedding",
        "callback"
      ],
      "devDependencies": {
        "contributors": "*",
        "mocha": "*",
        "mocha-phantomjs": "*",
        "component": "*",
        "chai": "*"
      },
      "author": {
        "name": "fengmk2",
        "email": "fengmk2@gmail.com"
      },
      "license": "MIT",
      "contributors": [
        {
          "name": "fengmk2",
          "email": "fengmk2@gmail.com",
          "url": "https://github.com/fengmk2"
        },
        {
          "name": "dead-horse",
          "email": "dead_horse@qq.com",
          "url": "https://github.com/dead-horse"
        }
      ],
      "gitHead": "b42a708414a704336e9dee570a963e2dbe43e529",
      "bugs": {
        "url": "https://github.com/fengmk2/pedding/issues"
      },
      "homepage": "https://github.com/fengmk2/pedding",
      "_id": "pedding@1.0.0",
      "_shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
      "_from": ".",
      "_npmVersion": "1.4.13",
      "_npmUser": {
        "name": "fengmk2",
        "email": "fengmk2@gmail.com"
      },
      "maintainers": [
        {
          "name": "fengmk2",
          "email": "fengmk2@gmail.com"
        },
        {
          "name": "dead-horse",
          "email": "dead_horse@qq.com"
        }
      ],
      "dist": {
        "shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
        "tarball": "http://registry.npmjs.org/pedding/-/pedding-1.0.0.tgz"
      },
      "directories": {}
    }
  },
  "readme": "# pedding\n readme...",
  "maintainers": [
    {
      "name": "fengmk2",
      "email": "fengmk2@gmail.com"
    },
    {
      "name": "dead-horse",
      "email": "dead_horse@qq.com"
    },
    {
      "name": "dead_horse",
      "email": "dead_horse@qq.com"
    }
  ],
  "time": {
    "modified": "2014-07-05T14:22:53.849Z",
    "created": "2012-09-18T14:46:08.346Z",
    "0.0.1": "2012-09-18T14:46:21.321Z",
    "0.0.2": "2013-06-22T08:26:45.125Z",
    "0.0.3": "2013-07-02T15:20:34.707Z",
    "1.0.0": "2014-07-05T11:08:51.614Z"
  },
  "author": {
    "name": "fengmk2",
    "email": "fengmk2@gmail.com"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/fengmk2/pedding.git"
  },
  "keywords": [
    "pedding",
    "callback"
  ],
  "bugs": {
    "url": "https://github.com/fengmk2/pedding/issues"
  },
  "license": "MIT",
  "readmeFilename": "README.md",
  "homepage": "https://github.com/fengmk2/pedding",
  "contributors": [
    {
      "name": "fengmk2",
      "email": "fengmk2@gmail.com",
      "url": "https://github.com/fengmk2"
    },
    {
      "name": "dead-horse",
      "email": "dead_horse@qq.com",
      "url": "https://github.com/dead-horse"
    }
  ],
  "_attachments": {}
}
```

### Get a special version or tag package

```
GET /:package/:tag_or_version
```

#### Reponse

```json
HTTP/1.1 200 OK
Etag: "1WJ4JF535RO3BDZR2BARXSGLY"
Content-Type: application/json
Cache-Control: max-age=60
Content-Length: 1183

{
  "name": "pedding",
  "version": "1.0.0",
  "description": "Just pedding for callback.",
  "main": "index.js",
  "scripts": {
    "test": "make test-all"
  },
  "repository": {
    "type": "git",
    "url": "git://github.com/fengmk2/pedding.git"
  },
  "keywords": [
    "pedding",
    "callback"
  ],
  "devDependencies": {
    "contributors": "*",
    "mocha": "*",
    "mocha-phantomjs": "*",
    "component": "*",
    "chai": "*"
  },
  "author": {
    "name": "fengmk2",
    "email": "fengmk2@gmail.com"
  },
  "license": "MIT",
  "contributors": [
    {
      "name": "fengmk2",
      "email": "fengmk2@gmail.com",
      "url": "https://github.com/fengmk2"
    },
    {
      "name": "dead-horse",
      "email": "dead_horse@qq.com",
      "url": "https://github.com/dead-horse"
    }
  ],
  "gitHead": "b42a708414a704336e9dee570a963e2dbe43e529",
  "bugs": {
    "url": "https://github.com/fengmk2/pedding/issues"
  },
  "homepage": "https://github.com/fengmk2/pedding",
  "_id": "pedding@1.0.0",
  "_shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
  "_from": ".",
  "_npmVersion": "1.4.13",
  "_npmUser": {
    "name": "fengmk2",
    "email": "fengmk2@gmail.com"
  },
  "maintainers": [
    {
      "name": "fengmk2",
      "email": "fengmk2@gmail.com"
    },
    {
      "name": "dead-horse",
      "email": "dead_horse@qq.com"
    }
  ],
  "dist": {
    "shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
    "tarball": "http://registry.npmjs.org/pedding/-/pedding-1.0.0.tgz"
  },
  "directories": {}
}
```

### Publish a new package

* Authentication required.

```
PUT /:package
```

#### Input

```json
{
  "_id": "pedding",
  "name": "pedding",
  "description": "Just pedding for callback.",
  "dist-tags": {
    "latest": "1.0.0"
  },
  "versions": {
    "1.0.0": {
      "name": "pedding",
      "version": "1.0.0",
      "description": "Just pedding for callback.",
      "main": "index.js",
      "scripts": {
        "test": "make test-all"
      },
      "repository": {
        "type": "git",
        "url": "git://github.com/fengmk2/pedding.git"
      },
      "keywords": [ "pedding","callback" ],
      "devDependencies": {
        "contributors": "*",
        "mocha": "*",
        "mocha-phantomjs": "*",
        "component": "*",
        "chai": "*"
      },
      "dependencies": {},
      "author": {
        "name": "fengmk2",
        "email": "fengmk2@gmail.com"
      },
      "license": "MIT",
      "contributors": [
        {
          "name": "fengmk2",
          "email": "fengmk2@gmail.com",
          "url": "https://github.com/fengmk2"
        },
        {
          "name": "dead-horse",
          "email": "dead_horse@qq.com",
          "url": "https://github.com/dead-horse"
        }
      ],
      "readme": "# pedding ...",
      "readmeFilename": "README.md",
      "gitHead": "b42a708414a704336e9dee570a963e2dbe43e529",
      "bugs": {
        "url": "https://github.com/fengmk2/pedding/issues"
      },
      "homepage": "https://github.com/fengmk2/pedding",
      "_id": "pedding@1.0.0",
      "_shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
      "_from": ".",
      "_npmVersion": "1.5.0-alpha-4",
      "_npmUser": {
        "name": "admin",
        "email": "fengmk2@gmail.com"
      },
      "maintainers": [
        {
          "name": "admin",
          "email": "fengmk2@gmail.com"
        }
      ],
      "dist": {
        "shasum": "7f5098d60307b4ef7240c3d693cb20a9473c6074",
        "tarball": "https://registry.npmjs.org/pedding/-/pedding-1.0.0.tgz"
      }
    }
  },
  "readme": "# pedding ...",
  "maintainers": [
    {
      "name": "admin",
      "email": "fengmk2@gmail.com"
    }
  ],
  "_attachments": {
    "pedding-1.0.0.tgz":{
      "content_type": "application/octet-stream",
      "data": "H4sIAAAAAAAAA+0aa3PbNjKf8Su...",
      "length": 2107
    }
  }
}
```

#### Response

```json
Status: 201 Created

{
  "ok": true,
  "rev": "11-e6d1e6e96eaf72433fef6aaabe843af8"
}
```

### Update a package's tag

* Authentication required.

```
PUT /:package/:tag
```

#### Input

The total input body is the `version` string which's setting to the tag.

```json
"1.0.0"
```

#### Response

```json
Status: 201 Created

{
  "ok": true
}
```

### Update a package's maintainers

* Authentication required.

```
PUT /:package/-rev/:rev
```

#### Input

```json
{
  "_id": "pedding",
  "_rev": "11-e6d1e6e96eaf72433fef6aaabe843af8",
  "maintainers":[
    { "name": "fengmk2", "email": "fengmk2@gmail.com" },
    { "name": "dead-horse", "email": "dead_horse@qq.com" }
  ]
}
```

#### Response

```json
Status: 201 Created

{
  "ok": true,
  "id": "pedding",
  "rev": "12-bb300a90c9aeb779748b83ec1b744039"
}
```

### Remove one version from package

* Authentication required.

```
PUT /:package/-rev/:rev
```

#### Input

Example for removing `0.0.1` version:

```json
{
  "_id": "pedding",
  "_rev": "12-bb300a90c9aeb779748b83ec1b744039",
  "name": "pedding",
  "description": "desc",
  "dist-tags": { "latest": "1.0.0" },
  "maintainers":
   [ ... ],
  "time":
   { ... },
  "users": {},
  "author": { ... },
  "repository": { ... },
  "versions":
   { "1.0.0":
      { ... },
     "0.0.3":
      { ... },
     "0.0.2":
      { ... } },
  "readme": "...",
  "homepage": "https://github.com/fengmk2/pedding",
  "bugs": { ... },
  "license": "MIT" }
```

#### Response

```json
Status: 201 Created

{
  "ok": true
}
```

### Remove a tgz file from package

* Authentication required.

```
DELETE /:tgzfilepath/-rev/:rev
```

Exmaple for removing `https://registry.npmjs.org/pedding/-/pedding-0.0.1.tgz` file:

```
DELETE /pedding/-/pedding-0.0.1.tgz/-rev/12-bb300a90c9aeb779748b83ec1b744039
```

#### Response

```json
Status: 200 OK

{
  "ok": true
}
```

### List packages since from a update time

```
GET /-/all/since?stale=update_after&startkey=:startkey
```

* `startkey` is a ms timestamp

#### Response

```bash
$ curl -i "https://registry.npmjs.org/-/all/since?stale=update_after&startkey=1407255748643"
```

```json
HTTP/1.1 200 OK

{
  "_updated": 1407255883282,
  "bacon-and-eggs": {
    "name": "bacon-and-eggs",
    "description": "A functional reactive Twitter API client in node",
    "dist-tags": {
      "latest": "0.0.4"
    },
    "maintainers": [
      {
        "name": "mikegroseclose",
        "email": "mike.groseclose@gmail.com"
      }
    ],
    "homepage": "http://github.com/mikegroseclose/bacon-and-eggs",
    "keywords": [
      "twitter",
      "api",
      "frp",
      "functional",
      "reactive",
      "bacon",
      "eggs",
      "oauth",
      "stream",
      "streams"
    ],
    "repository": {
      "type": "git",
      "url": "git://github.com/mikegroseclose/gulp-regex-replace.git"
    },
    "author": {
      "name": "Mike Groseclose",
      "email": "mike.groseclose@gmail.com",
      "url": "http://mikegroseclose.com"
    },
    "bugs": {
      "url": "https://github.com/mikegroseclose/gulp-regex-replace/issues"
    },
    "readmeFilename": "README.md",
    "time": {
      "modified": "2014-08-05T16:21:17.041Z"
    },
    "versions": {
      "0.0.4": "latest"
    }
  },
  "git-perm-rm": {
    "name": "git-perm-rm",
    "description": "Permanently remove a file or directory from a git repo including all related commit records.",
    "dist-tags": {
      "latest": "1.0.1"
    },
    "maintainers": [
      {
        "name": "kael",
        "email": "i@kael.me"
      }
    ],
    "homepage": "https://github.com/kaelzhang/git-perm-rm",
    "keywords": [
      "git",
      "rm",
      "git-perm-rm",
      "remove",
      "permanently"
    ],
    "repository": {
      "type": "git",
      "url": "git://github.com/kaelzhang/git-perm-rm.git"
    },
    "author": {
      "name": "Kael"
    },
    "bugs": {
      "url": "https://github.com/kaelzhang/git-perm-rm/issues"
    },
    "license": "MIT",
    "readmeFilename": "README.md",
    "time": {
      "modified": "2014-08-05T16:22:41.253Z"
    },
    "versions": {
      "1.0.1": "latest"
    }
  }
}
```

## User

* [Get a single user](/docs/registry-api.md#get-a-single-user)
* [Add a new user](/docs/registry-api.md#add-a-new-user)
* [Update a exists user](/docs/registry-api.md#update-a-exists-user)

### Get a single user

```
GET /-/user/org.couchdb.user::username
```

#### Response

```json
HTTP/1.1 200 OK
ETag: "32-984ee97e01aea166dcab6d1517c730e3"

{
  "_id": "org.couchdb.user:fengmk2",
  "_rev": "32-984ee97e01aea166dcab6d1517c730e3",
  "name": "fengmk2",
  "email": "fengmk2@gmail.com",
  "type": "user",
  "roles": [],
  "date": "2014-08-04T10:43:07.063Z",
  "fullname": "fengmk2",
  "avatar": "https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=50&d=retro",
  "freenode": "",
  "github": "fengmk2",
  "homepage": "http://fengmk2.github.com",
  "twitter": "fengmk2",
  "avatarMedium": "https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=100&d=retro",
  "avatarLarge": "https://secure.gravatar.com/avatar/95b9d41231617a05ced5604d242c9670?s=496&d=retro",
  "fields": [
    {
      "name": "fullname",
      "value": "fengmk2",
      "title": "Full Name",
      "show": "fengmk2"
    },
    {
      "name": "email",
      "value": "fengmk2@gmail.com",
      "title": "Email",
      "show": "<a href=\"mailto:fengmk2@gmail.com\">fengmk2@gmail.com</a>"
    },
    {
      "name": "github",
      "value": "fengmk2",
      "title": "Github",
      "show": "<a rel=\"me\" href=\"https://github.com/fengmk2\">fengmk2</a>"
    },
    {
      "name": "twitter",
      "value": "fengmk2",
      "title": "Twitter",
      "show": "<a rel=\"me\" href=\"https://twitter.com/fengmk2\">@fengmk2</a>"
    },
    {
      "name": "appdotnet",
      "value": "",
      "title": "App.net",
      "show": ""
    },
    {
      "name": "homepage",
      "value": "http://fengmk2.github.com",
      "title": "Homepage",
      "show": "<a rel=\"me\" href=\"http://fengmk2.github.com/\">http://fengmk2.github.com</a>"
    },
    {
      "name": "freenode",
      "value": "",
      "title": "IRC Handle",
      "show": ""
    }
  ],
  "appdotnet": "fengmk2"
}
```

### Add a new user

```
PUT /-/user/org.couchdb.user::username
```

#### Input

```json
{
  "name": "admin",
  "password": "123",
  "email": "fengmk2@gmail.com",
  "_id": "org.couchdb.user:admin",
  "type": "user",
  "roles": [],
  "date": "2014-08-05T16:05:17.792Z"
}
```

#### Response

```json
Status: 201 Created

{
  "ok": true,
  "id": "org.couchdb.user:fengmk2",
  "rev": "32-984ee97e01aea166dcab6d1517c730e3"
}
```

### Update a exists user

* Authentication required.

```
PUT /-/user/org.couchdb.user::username/-rev/:rev
```

#### Input

```json
{
  "name": "admin",
  "password": "123",
  "email": "fengmk2@gmail.com",
  "_id": "org.couchdb.user:admin",
  "type": "user",
  "roles": [],
  "date": "2014-08-05T16:05:17.792Z",
  "_rev": "2-1a18c3d73ba42e863523a399ff3304d8"
}
```

#### Response

```json
Status: 201 Created

{
  "ok": true,
  "id": "org.couchdb.user:fengmk2",
  "rev": "3-bb300a90c9aeb779748b83ec1b744039"
}
```

## Search
