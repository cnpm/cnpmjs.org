# NPM Registry API

## Overview

* [Schema](/docs/registry-api.md#schema)
* [Client Errors](/docs/registry-api.md#client-errors)
* [Authentication](/docs/registry-api.md#authentication)
* [Package](/docs/registry-api.md#package)
* [User](/docs/registry-api.md#user)
* [Search](/docs/registry-api.md#search)

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/f6c8cb46358039bcd689#?env%5BRegistry%5D=W3sia2V5IjoicmVnaXN0cnkiLCJ0eXBlIjoidGV4dCIsInZhbHVlIjoiaHR0cHM6Ly9yZWdpc3RyeS5ucG0udGFvYmFvLm9yZyIsImVuYWJsZWQiOnRydWV9LHsia2V5IjoicGFja2FnZSIsInZhbHVlIjoiY25wbSIsInR5cGUiOiJ0ZXh0IiwiZW5hYmxlZCI6dHJ1ZX1d)

## Schema

All API access is over HTTPS or HTTP,
and accessed from the `registry.npmjs.org` domain.
All data is sent and received as JSON.

```bash
$ curl -i https://registry.npmjs.org

HTTP/1.1 200 OK

{
  "db_name": "registry",
  "doc_count": 123772,
  "doc_del_count": 377,
  "update_seq": 685591,
  "purge_seq": 0,
  "compact_running": false,
  "disk_size": 634187899,
  "data_size": 445454185,
  "instance_start_time": "1420670152481614",
  "disk_format_version": 6,
  "committed_update_seq": 685591
}
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
$ curl -i -X "GET" -u "foo:pwd" \
    "https://registry.npmjs.com/-/user/org.couchdb.user:npm-user-service-testuser?write=true"

HTTP/1.1 401 Unauthorized

{"error":"unauthorized","reason":"Name or password is incorrect."}
```

## Package

* Read
  * [Get a single package](/docs/registry-api.md#get-a-single-package)
  * [Get a special version or tag package](/docs/registry-api.md#get-a-special-version-or-tag-package)
  * [List packages since from a update time](/docs/registry-api.md#list-packages-since-from-a-update-time)
  * [List package names by users](/docs/registry-api.md#list-package-names-by-users)
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

#### Response 200

```json
HTTP/1.1 200 OK
Etag: "8UDCP753LFXOG42NMX88JAN40"

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

#### Response 404

```json
HTTP/1.1 404 Object Not Found

{
  "error": "not_found",
  "reason": "document not found"
}
```

### ~~Get a special version or tag package~~

__deprecated__

```
GET /:package/:tag_or_version
```

#### Reponse 200

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
* In any delete, note that __the version number still cannot be reused__.

```
PUT /:package/-rev/:rev
```

#### Input

Remove that specific version from the versions hash in the `PUT` body.

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

### Remove all versions of a package

* Authentication required.
* In any delete, note that __the version number still cannot be reused__.

```
DELETE /:package/-rev/:rev
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

### List package names by users

```bash
GET /-/by-user/$username[|$another1[|$another2...]]
```

* `username` user name like `fengmk2`
* also support multi users by `name1|name2|name3`

#### Response

```bash
$ curl -i "https://registry.npmjs.org/-/by-user/czy88840616"
$ curl -i "https://registry.npmjs.org/-/by-user/czy88840616|fengmk2|dead-horse"
```

```json
HTTP/1.1 200 OK

{
  "czy88840616": [
    "easyconf",
    "egg",
    "flag",
    "gdp",
    "generator-webx-vm",
    "magic-cube",
    "rim",
    "tbuild",
    "test-publish",
    "velocity-parser",
    "vmarket",
    "wi"
  ]
}
```

## User

- [Auth user](/docs/registry-api.md#auth-user)
- [Get a single user](/docs/registry-api.md#get-a-single-user)
- [Add a new user](/docs/registry-api.md#add-a-new-user)
- [Update a exists user](/docs/registry-api.md#update-a-exists-user)

### Auth user

* Authentication required.

```
GET /-/user/org.couchdb.user::username?write=true
```

#### Response 200

```json
HTTP/1.1 200 OK
ETag: "5-a31b61ba3c50b50f7fcaf185e079e17a"

{
  "_id": "org.couchdb.user:npm-user-service-testuser",
  "_rev": "5-a31b61ba3c50b50f7fcaf185e079e17a",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "name": "npm-user-service-testuser",
  "email": "fengmk2@gmail.com",
  "type": "user",
  "roles": [],
  "date": "2015-01-04T08:28:51.378Z",
  "password_scheme": "pbkdf2",
  "iterations": 10,
  "derived_key": "644157c126b93356e6eba2c59fdf1b7ec644ebf2",
  "salt": "5d13874c0aa10751e35743bacd6eedd5"
}
```

#### Response 401

```json
HTTP/1.1 401 Unauthorized

{
  "error": "unauthorized",
  "reason": "Name or password is incorrect."
}
```

### Get a single user

```
GET /-/user/org.couchdb.user::username
```

#### Response 200

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

#### Response 404

```json
HTTP/1.1 404 Object Not Found

{
  "error": "not_found",
  "reason": "missing"
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

#### Response 201

```json
Status: 201 Created

{
  "ok": true,
  "id": "org.couchdb.user:fengmk2",
  "rev": "32-984ee97e01aea166dcab6d1517c730e3"
}
```

#### Response 409

User already exists

```json
HTTP/1.1 409 Conflict

{
  "error": "conflict",
  "reason": "Document update conflict."
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
