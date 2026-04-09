create table if not exists player_saves (
  app_id text not null,
  player_id text not null,
  slot_id text not null,
  snapshot_json text not null,
  updated_at text not null,
  primary key (app_id, player_id, slot_id)
);
