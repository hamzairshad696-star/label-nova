# LOCAL test DB only. Removes accounts whose email ends with the given domain (e.g. p4.test), with their data.
D="$1"
psql postgres://ln:ln@localhost:5432/labelnova -q <<SQL
begin;
set local session_replication_role = replica;
delete from wallet_ledger where user_id in (select id from users where email like '%@$D');
delete from shipment_events where shipment_id in (select s.id from shipments s join users u on u.id=s.owner_user_id where u.email like '%@$D');
delete from shipments where owner_user_id in (select id from users where email like '%@$D');
delete from user_roles where user_id in (select id from users where email like '%@$D');
delete from sessions where user_id in (select id from users where email like '%@$D');
delete from auth_accounts where user_id in (select id from users where email like '%@$D');
delete from users where email like '%@$D';
delete from rate_limits;
commit;
SQL
