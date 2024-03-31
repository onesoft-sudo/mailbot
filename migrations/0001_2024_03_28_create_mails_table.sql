create table mails(
    id bigserial primary key,
    title varchar(255) default null,
    channel_id varchar(255) not null,
    guild_id varchar(255) not null,
    user_id varchar(255) not null,
    messages bigint not null default 1,
    closed boolean not null default false,
    attributes varchar(255) not null default '{}',
    updated_at timestamp(6) with time zone default clock_timestamp(),
    created_at timestamp(6) with time zone default clock_timestamp()
);