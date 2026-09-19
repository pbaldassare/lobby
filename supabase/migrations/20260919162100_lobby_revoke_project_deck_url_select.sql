-- Il GRANT SELECT sulla tabella aveva riammesso private_deck_url.
-- Il path del deck si legge solo da lobby.project_deck_url(id).

revoke select (private_deck_url) on lobby.projects from authenticated;
