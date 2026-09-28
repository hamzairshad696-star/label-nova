# LOCAL test database only (localhost). Removes accounts created by the test suites, including their
# shipments and ledger rows. Bypasses the append-only trigger and FKs for this session only — never do this elsewhere.
psql postgres://ln:ln@localhost:5432/labelnova -q <<'SQL'
begin;
set local session_replication_role = replica;
delete from wallet_ledger where user_id in (select id from users where email like '%.test');
delete from shipment_events where shipment_id in (select s.id from shipments s join users u on u.id=s.owner_user_id where u.email like '%.test');
delete from shipments where owner_user_id in (select id from users where email like '%.test');
delete from user_roles where user_id in (select id from users where email like '%.test');
delete from sessions where user_id in (select id from users where email like '%.test');
delete from auth_accounts where user_id in (select id from users where email like '%.test');
delete from users where email like '%.test';
commit;
SQL
