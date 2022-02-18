CREATE TABLE IF NOT EXISTS users (
  id serial primary key,
  username character varying(64) not null unique,
  password character varying(256) not null
);

CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.events(
  ID serial,
  name varchar(64) not null,
  description text,
  created timestamp with time zone default NOW(),
  updated timestamp with time zone default NOW(),
  CONSTRAINT PK_events PRIMARY KEY(ID)
);

CREATE TRIGGER set_timestamp
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.registration(
  ID serial,
  name varchar(64) not null,
  comment varchar(400),
  eventid int NOT NULL,
  created timestamp with time zone default NOW(),
  PRIMARY KEY (ID),
  CONSTRAINT FK_EventReg FOREIGN KEY (eventid)
  REFERENCES events(eventid)
);
