-- Nome file del deck: visibile al proprietario. Il path resta su
-- private_deck_url e si legge solo da lobby.project_deck_url().

alter table lobby.projects
  add column if not exists private_deck_file_name text;

comment on column lobby.projects.private_deck_file_name is
  'Solo il nome del file. Il path non è in SELECT: usare lobby.project_deck_url(id).';

revoke select (private_deck_url) on lobby.projects from authenticated;
