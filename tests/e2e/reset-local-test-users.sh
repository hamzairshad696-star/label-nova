# LOCAL test database only (localhost). Removes test accounts (*.test), their shipments and ledger rows, and
# all pricing catalog rows. Bypasses the append-only triggers and FKs for this one transaction — never do this elsewhere.
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
