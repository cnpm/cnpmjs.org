create table user (
  id bigint unsigned  not null comment 'primary key' auto_increment,
  gmt_create datetime  not null comment 'create time',
  gmt_modified datetime not null comment 'modified time',
  name varchar(200) not null comment 'user name',
  password varchar(32) not null comment 'user password hash',
  ip varchar(64) not null comment 'user last request ip',
  session varchar(200) not null comment 'auth session',
  primary key (id),
  unique key name (name),
  unique key name (session),
  key gmt_modified (gmt_modified)
) comment='user base info';
