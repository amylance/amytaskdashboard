-- Reference UI exposes free-text contact/category fields plus an optional
-- link (url + label) per task. None of these need referential integrity --
-- contact is a name, not a user_id -- so plain nullable text columns.
alter table public.todos
  add column contact text,
  add column category text,
  add column link_url text,
  add column link_label text;
