CREATE TABLE IF NOT EXISTS people (
  id serial primary key,
  name varchar(32) not null unique,
  email varchar(64) not null unique,
  nationalId varchar(10) not null unique,
  comment text not null,
  date timestamp with time zone not null default current_timestamp
);

CREATE TABLE IF NOT EXISTS users (
  id serial primary key,
  username character varying(64) not null unique,
  password character varying(255) not null
);



CREATE TABLE IF NOT EXISTS signatures(
  id serial primary key,
  name varchar(128) not null,
  nationalId varchar(10) not null unique,
  comment varchar(400) not null,
  anonymous boolean not null default true,
  signed timestamp with time zone not null default current_timestamp
);
