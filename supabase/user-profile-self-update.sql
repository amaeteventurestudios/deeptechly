-- Allow signed-in users to update only their own editable profile fields.
-- Protected access, admin, invite, plan, credits, and timestamp fields remain
-- unavailable to authenticated browser clients.

alter table public.users_profile enable row level security;

drop policy if exists "Users can update own editable DeepTechly profile"
  on public.users_profile;

create policy "Users can update own editable DeepTechly profile"
on public.users_profile
for update
to authenticated
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

revoke update on public.users_profile from authenticated;
grant update (full_name, organization) on public.users_profile to authenticated;
