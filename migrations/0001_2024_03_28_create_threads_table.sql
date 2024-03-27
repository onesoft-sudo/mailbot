create table threads(
    id bigserial primary key,
    channel_id varchar(255) not null,
    guild_id varchar(255) not null,
    title varchar(255) default null,
    user_id varchar(255) not null,
    updated_at timestamp(6) with time zone default clock_timestamp(),
    created_at timestamp(6) with time zone default clock_timestamp()
);