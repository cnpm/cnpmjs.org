# Migrating from 1.x to 2.x

2.x using [Sequelize] ORM to supports MySQL, MariaDB, SQLite or PostgreSQL databases.

## New download total table structure

### Create `downloads` table SQL

You should create `downloads` table first:

```sql
CREATE TABLE IF NOT EXISTS `downloads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT 'primary key',
  `gmt_create` datetime NOT NULL COMMENT 'create time',
  `gmt_modified` datetime NOT NULL COMMENT 'modified time',
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL COMMENT 'module name',
  `date` int unsigned NOT NULL COMMENT 'YYYYMM format',
  `d01` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '01 download count',
  `d02` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '02 download count',
  `d03` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '03 download count',
  `d04` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '04 download count',
  `d05` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '05 download count',
  `d06` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '06 download count',
  `d07` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '07 download count',
  `d08` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '08 download count',
  `d09` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '09 download count',
  `d10` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '10 download count',
  `d11` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '11 download count',
  `d12` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '12 download count',
  `d13` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '13 download count',
  `d14` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '14 download count',
  `d15` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '15 download count',
  `d16` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '16 download count',
  `d17` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '17 download count',
  `d18` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '18 download count',
  `d19` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '19 download count',
  `d20` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '20 download count',
  `d21` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '21 download count',
  `d22` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '22 download count',
  `d23` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '23 download count',
  `d24` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '24 download count',
  `d25` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '25 download count',
  `d26` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '26 download count',
  `d27` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '27 download count',
  `d28` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '28 download count',
  `d29` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '29 download count',
  `d30` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '30 download count',
  `d31` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '31 download count',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_date` (`name`, `date`),
  KEY `date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='module download total info';
```

### Sync `download_total` to `downloads`

Then use [sync_download_total.js](../tools/sync_download_total.js) scrpt to sync datas from `download_total`:

```bash
$ node --harmony tools/sync_download_total.js
```

# `config.js` changes in 2.x

## New database config

```js
/**
* database config
*/

database: {
  db: 'cnpmjs_test',
  username: 'root',
  password: '',

  // the sql dialect of the database
  // - currently supported: 'mysql', 'sqlite', 'postgres', 'mariadb'
  dialect: 'sqlite',

  // custom host; default: 127.0.0.1
  host: '127.0.0.1',

  // custom port; default: 3306
  port: 3306,

  // use pooling in order to reduce db connection overload and to increase speed
  // currently only for mysql and postgresql (since v1.5.0)
  pool: {
    maxConnections: 10,
    minConnections: 0,
    maxIdleTime: 30000
  },

  // the storage engine for 'sqlite'
  // default store into ~/cnpmjs.org.sqlite
  storage: path.join(process.env.HOME || root, 'cnpmjs.org.sqlite'),

  logging: !!process.env.SQL_DEBUG,
},
```

If you're still using MySQL and old config.js `mysqlServers: []` from 1.x:

```js
mysqlServers: [
{
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: ''
}
],
mysqlDatabase: 'cnpmjs_test',
mysqlMaxConnections: 4,
mysqlQueryTimeout: 5000,
```

We will do forward compat, and auto change old style config.js to:

```js
database: {
  db: 'cnpmjs_test',
  username: 'root',
  password: '',
  dialect: 'mysql',
  host: '127.0.0.1',
  port: 3306,
  pool: {
    maxConnections: 10,
    minConnections: 0,
    maxIdleTime: 30000
    },
  logging: !!process.env.SQL_DEBUG,
},
```

## remove `adaptScope`

`adaptScope: true | false` feature was removed.


[Sequelize]: http://sequelizejs.com/
