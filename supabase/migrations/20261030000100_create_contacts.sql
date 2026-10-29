-- À appliquer une seule fois dans le projet Supabase DEV validé.
-- Aucune donnée locale n'est importée. Ne pas exécuter en PROD sans validation.
begin;

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nom text not null,
  prenom text not null,
  email text not null,
  created_at timestamptz not null default now(),
  constraint contacts_nom_valid check (char_length(btrim(nom)) between 1 and 100),
  constraint contacts_prenom_valid check (char_length(btrim(prenom)) between 1 and 100),
  constraint contacts_email_valid check (
    char_length(email) <= 254
    and email = btrim(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  )
);

create index contacts_user_created_idx on public.contacts (user_id, created_at desc);

alter table public.contacts enable row level security;

revoke all on table public.contacts from public, anon, authenticated;
grant select, delete on table public.contacts to authenticated;
grant insert (nom, prenom, email) on table public.contacts to authenticated;
grant update (nom, prenom, email) on table public.contacts to authenticated;

create policy contacts_select_own on public.contacts
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy contacts_insert_own on public.contacts
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy contacts_update_own on public.contacts
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy contacts_delete_own on public.contacts
  for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
