# Install & Get Started

## Deps

* MySQL Server: http://db4free.net/
* qiniu CDN: http://www.qiniu.com/
* redis session: https://garantiadata.com Support 24MB free spaces.
* node: >=0.10.21

## Clone

```bash
$ git clone git://github.com/fengmk2/cnpmjs.org.git $HOME/cnpmjs.org
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
  debug: false,
  enableCluster: true, // enable cluster mode
  logdir: 'your application log dir',
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
$ ./bin/nodejsctl start

Starting cnpmjs.org ...
Start nodejs success. PID=27175
```

## open registry and web

```bash
# registry
$ open http://localhost:7001
# web
$ open http://localhost:7002
```
