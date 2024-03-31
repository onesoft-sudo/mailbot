create table messages(
     id bigserial primary key,
     content varchar(255) default null,
     thread_id bigint not null,
     user_id varchar(255) not null,
     type varchar(255) default 'user_reply',
     serial_number bigint default 0,
     message_id varchar(255) not null,
     attributes varchar(255) not null default '{}',
     created_at timestamp(6) with time zone default clock_timestamp()
);