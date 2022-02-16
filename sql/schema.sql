CREATE TABLE IF NOT EXISTS public.people (
  id serial primary key,
  name varchar(32) not null unique,
  email varchar(64) not null unique,
  nationalId varchar(10) not null unique,
  comment text not null,
  date timestamp with time zone not null default current_timestamp
);
