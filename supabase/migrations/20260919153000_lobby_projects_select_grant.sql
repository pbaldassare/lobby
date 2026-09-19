-- PostgREST fa SELECT * su projects: il GRANT per-colonna dopo REVOKE
-- sulla tabella toglieva la lettura e la lista restava vuota.
-- SELECT a livello tabella, togliamo solo private_deck_url (si passa da RPC).

grant select on lobby.projects to authenticated;
revoke select (private_deck_url) on lobby.projects from authenticated;
