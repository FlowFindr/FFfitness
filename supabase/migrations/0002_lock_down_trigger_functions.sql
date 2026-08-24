-- Trigger helpers were reachable as REST endpoints (/rest/v1/rpc/...).
-- Postgres fires triggers without checking EXECUTE on the caller, so revoking
-- it closes the endpoint while leaving the triggers working.

revoke execute on function public.handle_new_user()  from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
