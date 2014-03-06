cnpmjs.org
=======

[![Build Status](https://secure.travis-ci.org/cnpm/cnpmjs.org.png)](http://travis-ci.org/cnpm/cnpmjs.org) [![Dependency Status](https://gemnasium.com/cnpm/cnpmjs.org.png)](https://gemnasium.com/cnpm/cnpmjs.org)

[![NPM](https://nodei.co/npm/cnpmjs.org.png?downloads=true&stars=true)](https://nodei.co/npm/cnpmjs.org/)

![logo](https://raw.github.com/cnpm/cnpmjs.org/master/logo.png)

## What is this?

Private npm registry and web for Enterprise, base on [koa](http://koajs.com/), MySQL and [Simple Store Service](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

* @[dead-horse](https://github.com/dead-horse): [What is cnpm?](http://deadhorse.me/slides/cnpmjs.html)
* @[JacksonTian](https://github.com/JacksonTian/) had a talk about [private npm](https://speakerdeck.com/jacksontian/qi-ye-ji-node-dot-jskai-fa).

![cnpm](https://docs.google.com/drawings/d/12QeQfGalqjsB77mRnf5Iq5oSXHCIUTvZTwECMonqCmw/pub?w=480&h=360)


## Install

```bash
$ npm install --registry=http://r.cnpmjs.org --disturl=http://cnpmjs.org/dist
```

## Usage

```js
$ node --harmony-generators dispatch.js
```

**Notice**: need node version >=0.11.9

## Guide

* [How to deploy cnpmjs.org](https://github.com/cnpm/cnpmjs.org/wiki/Deploy)
* [NFS guide](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide)

## Authors

```bash
$ git summary

 project  : cnpmjs.org
 repo age : 3 months
 active   : 145 days
 commits  : 366
 files    : 94
 authors  :
   217  fengmk2                 59.3%
   146  dead_horse              39.9%
     2  4simple                 0.5%
     1  Alsotang                0.3%
```

## License

(The MIT License)

Copyright(c) cnpmjs.org and other contributors.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
