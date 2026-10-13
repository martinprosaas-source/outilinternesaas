-- Atelier : schéma de la base. À coller une fois dans Supabase › SQL Editor › Run.
-- Relançable sans risque (tout est « if not exists » / « or replace »).
--
-- Principe :
--   • membres   : les 3 places (nino, hugo, martin). Chacun crée son compte puis « prend » sa place une fois.
--   • dossiers  : un dossier = un document JSON (prospection, audit, devis, delivery).
--   • historique: le fil de chaque dossier (étapes + commentaires), en ajout seul : rien ne se perd si deux personnes écrivent en même temps.
-- Seuls les comptes qui ont pris une place voient et modifient les données (RLS).

-- ─────────────────────────── Membres ───────────────────────────
create table if not exists public.membres (
  id          text primary key check (id in ('nino', 'hugo', 'martin')),
  email       text unique,
  user_id     uuid unique references auth.users (id) on delete set null,
  rejoint_le  timestamptz
);
insert into public.membres (id) values ('nino'), ('hugo'), ('martin') on conflict (id) do nothing;

-- Ma place (nino / hugo / martin), ou null si je n'en ai pas encore pris.
create or replace function public.mon_membre() returns text
language sql stable security definer set search_path = public as $$
  select id from public.membres where user_id = auth.uid()
$$;

-- Les places encore libres (affichées après la création du compte).
create or replace function public.places_libres() returns setof text
language sql stable security definer set search_path = public as $$
  select id from public.membres where user_id is null order by id
$$;

-- Prendre sa place, une seule fois. Une place prise ne peut plus être reprise (sauf en la vidant ici, à la main).
create or replace function public.rejoindre(p_id text) returns text
language plpgsql security definer set search_path = public as $$
declare v text;
begin
  if auth.uid() is null then raise exception 'Connecte-toi d’abord.'; end if;
  select id into v from public.membres where user_id = auth.uid();
  if v is not null then return v; end if;
  update public.membres set user_id = auth.uid(), email = auth.jwt() ->> 'email', rejoint_le = now()
    where id = p_id and user_id is null;
  if not found then raise exception 'Cette place est déjà prise.'; end if;
  return p_id;
end $$;

revoke all on function public.rejoindre(text) from public, anon;
grant execute on function public.mon_membre() to authenticated;
grant execute on function public.places_libres() to authenticated;
grant execute on function public.rejoindre(text) to authenticated;

alter table public.membres enable row level security;
drop policy if exists membres_lecture on public.membres;
create policy membres_lecture on public.membres for select to authenticated
  using (public.mon_membre() is not null or user_id = auth.uid());

-- ─────────────────────────── Dossiers ───────────────────────────
create table if not exists public.dossiers (
  id        text primary key,
  data      jsonb not null,
  cree_le   timestamptz not null default now(),
  maj_le    timestamptz not null default now(),
  maj_par   text,          -- nino / hugo / martin
  instance  text           -- onglet qui a écrit (pour ne pas se renvoyer ses propres modifications)
);

create table if not exists public.historique (
  id          text primary key,
  dossier_id  text not null references public.dossiers (id) on delete cascade,
  date        timestamptz not null default now(),
  qui         text,
  texte       text not null,
  type        text not null default 'note'   -- etape / commentaire / note
);
create index if not exists historique_dossier on public.historique (dossier_id, date desc);

alter table public.dossiers enable row level security;
alter table public.historique enable row level security;

drop policy if exists dossiers_equipe on public.dossiers;
create policy dossiers_equipe on public.dossiers for all to authenticated
  using (public.mon_membre() is not null) with check (public.mon_membre() is not null);

drop policy if exists historique_lecture on public.historique;
create policy historique_lecture on public.historique for select to authenticated
  using (public.mon_membre() is not null);
drop policy if exists historique_ajout on public.historique;
create policy historique_ajout on public.historique for insert to authenticated
  with check (public.mon_membre() is not null);

-- ─────────────────────────── Temps réel ───────────────────────────
-- Les trois voient les changements des autres sans recharger la page.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'dossiers') then
    alter publication supabase_realtime add table public.dossiers;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'historique') then
    alter publication supabase_realtime add table public.historique;
  end if;
end $$;
