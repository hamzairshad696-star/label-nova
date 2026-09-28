# LOCAL test database only. Clears the pricing catalog (bypassing append-only/no-delete triggers for this transaction).
psql postgres://ln:ln@localhost:5432/labelnova -q <<'SQL'
begin;
set local session_replication_role = replica;
delete from pricing_rule_changes; delete from pricing_rules; delete from carrier_services; delete from carriers;
commit;
SQL
