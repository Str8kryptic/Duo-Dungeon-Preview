create or replace function public.delete_player_account_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null or coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'not_authorized';
  end if;
  delete from public.player_step_syncs where user_id = p_user_id;
  delete from public.player_saves where user_id = p_user_id;
  delete from public.player_profiles where id = p_user_id;
end;
$$;
revoke all on function public.delete_player_account_data(uuid) from public, anon, authenticated;
grant execute on function public.delete_player_account_data(uuid) to service_role;
