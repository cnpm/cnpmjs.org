# Install & Get Started

## Deps

* MySQL Server: http://db4free.net/
* qiniu CDN: http://www.qiniu.com/
* redis session: https://garantiadata.com Support 24MB free spaces.
* node: >=0.10.21

## Clone

```bash
$ git clone get://github.com/fengmk2/cnpmjs.org.git $HOME/cnpmjs.org
$ cd $HOME/cnpmjs.org
```

## Create your `config.js`

```bash
$ touch config/config.js
$ vim config/config.js
```

`config.js` content sample:

```js
module.exports = {
  enableCluster: true, // enable cluster mode
  mysqlServers: [
    {
      host: 'your mysql host',
      port: 3306,
      user: 'yourname',
      password: 'your password'
    }
  ],
  mysqlDatabase: 'cnpmjs',
  redis: {
    host: 'your redist host',
    port: 6379,
  },
  qn: {
    accessKey: "your qiniu appkey",
    secretKey: "your secret key",
    bucket: "foobucket",
    domain: "http://foobucket.u.qiniudn.com"
  },
  enablePrivate: true, // enable private mode, only admin can publish, other use just can sync package from source npm
  admins: {
    admin: true,
  },
};
```

## Create MySQL Database and Tables

```bash
$ mysql -u yourname -p

mysql> use cnpmjs;
mysql> source docs/db.sql
```

## npm install

```bash
$ npm install
```

## start

```bash
 $ node dispatch.js

[Tue Dec 10 2013 22:50:41 GMT+0800 (CST)] [worker:9006] Server started, registry server listen at 7001, web listen at 7002, cluster: false
[Tue Dec 10 2013 22:50:42 GMT+0800 (CST)] [worker:9006] mysql ready, got 6 tables
```

## open registry and web

```bash
# registry
$ open http://localhost:7001
# web
$ open http://localhost:7002
```
