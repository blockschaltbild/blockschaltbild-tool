-- ============================================================================
-- Blockschaltbild Editor - Supabase Setup
-- ----------------------------------------------------------------------------
-- Einmalig im Supabase-Dashboard unter  SQL Editor  ->  New query  ausfuehren.
-- Erstellt: Nutzerprofile (mit 30-Tage-Zugang), Projektspeicher und die
-- Row-Level-Security-Policies, die dafuer sorgen, dass jeder Nutzer NUR seine
-- eigenen Projekte sieht. Admins sehen alle Nutzer/Projekte.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Profile: ein Datensatz pro Auth-Nutzer
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
    id                uuid primary key references auth.users(id) on delete cascade,
    email             text,
    role              text not null default 'user',          -- 'user' | 'admin'
    blocked           boolean not null default false,
    access_expires_at timestamptz not null default (now() + interval '30 days'),
    created_at        timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Projekte: die gespeicherten Blockschaltbilder (JSON)
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
    name           text,
    project_number text,
    data           jsonb not null,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- Papierkorb: "Loeschen" in der App setzt nur deleted_at (Soft-Delete).
-- Nur Admins koennen wiederherstellen oder endgueltig loeschen.
alter table public.projects add column if not exists deleted_at timestamptz;

create index if not exists idx_projects_user on public.projects(user_id);
alter table public.projects enable row level security;

-- ---------------------------------------------------------------------------
-- 2b) Sicherungen: vor jedem Ueberschreiben / Loeschen wird der alte Stand
--     automatisch weggeschrieben (Trigger). Nur Admins koennen darauf zugreifen.
--     project_id hat absichtlich KEINEN Fremdschluessel, damit Sicherungen auch
--     nach endgueltigem Loeschen des Projekts erhalten bleiben.
-- ---------------------------------------------------------------------------
create table if not exists public.project_backups (
    id             uuid primary key default gen_random_uuid(),
    project_id     uuid not null,
    user_id        uuid not null references auth.users(id) on delete cascade,
    name           text,
    project_number text,
    data           jsonb not null,
    reason         text not null,                               -- 'update' | 'trash' | 'delete'
    saved_at       timestamptz not null,                        -- updated_at des gesicherten Stands
    created_at     timestamptz not null default now()
);

create index if not exists idx_backups_project on public.project_backups(project_id, created_at desc);
create index if not exists idx_backups_user    on public.project_backups(user_id);
alter table public.project_backups enable row level security;

-- ---------------------------------------------------------------------------
-- 3) Hilfsfunktionen (SECURITY DEFINER -> umgehen RLS und vermeiden Rekursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_active()
returns boolean
language sql stable security definer set search_path = public as $$
    select coalesce((
        select (not blocked) and (role = 'admin' or access_expires_at > now())
        from public.profiles where id = auth.uid()
    ), false);
$$;

-- ---------------------------------------------------------------------------
-- 4) RLS-Policies fuer profiles
--    - Jeder sieht nur sein eigenes Profil.
--    - Admins sehen und aendern alle Profile (Zugang verlaengern, sperren, Rolle).
--    - Normale Nutzer koennen ihr eigenes Profil NICHT aendern
--      (damit niemand den eigenen 30-Tage-Zugang verlaengert).
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_select_own   on public.profiles for select using (id = auth.uid());
create policy profiles_select_admin on public.profiles for select using (public.is_admin());
create policy profiles_update_admin on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 5) RLS-Policies fuer projects
--    - Nutzer duerfen NUR ihre eigenen Projekte lesen/schreiben und nur solange
--      ihr Zugang aktiv ist (nicht gesperrt, nicht abgelaufen).
--    - Nutzer sehen nur Projekte, die NICHT im Papierkorb liegen.
--    - "Loeschen" durch Nutzer = deleted_at setzen (Update). Ein echtes DELETE
--      ist fuer Nutzer NICHT erlaubt -> versehentliches Loeschen ist umkehrbar.
--    - Admins duerfen alle Projekte sehen, aendern (wiederherstellen), anlegen
--      (Sicherung als neues Projekt zurueckspielen) und endgueltig loeschen.
-- ---------------------------------------------------------------------------
drop policy if exists projects_select_own   on public.projects;
drop policy if exists projects_insert_own   on public.projects;
drop policy if exists projects_update_own   on public.projects;
drop policy if exists projects_delete_own   on public.projects;
drop policy if exists projects_select_admin on public.projects;
drop policy if exists projects_insert_admin on public.projects;
drop policy if exists projects_update_admin on public.projects;
drop policy if exists projects_delete_admin on public.projects;

create policy projects_select_own on public.projects
    for select using (user_id = auth.uid() and public.is_active() and deleted_at is null);
create policy projects_insert_own on public.projects
    for insert with check (user_id = auth.uid() and public.is_active());
create policy projects_update_own on public.projects
    for update using (user_id = auth.uid() and public.is_active() and deleted_at is null)
              with check (user_id = auth.uid() and public.is_active());

create policy projects_select_admin on public.projects for select using (public.is_admin());
create policy projects_insert_admin on public.projects for insert with check (public.is_admin());
create policy projects_update_admin on public.projects for update using (public.is_admin()) with check (public.is_admin());
create policy projects_delete_admin on public.projects for delete using (public.is_admin());

-- Sicherungen: nur Admins lesen/loeschen. Schreiben passiert ausschliesslich
-- ueber den Trigger (SECURITY DEFINER), nicht durch Clients.
drop policy if exists backups_select_admin on public.project_backups;
drop policy if exists backups_delete_admin on public.project_backups;
create policy backups_select_admin on public.project_backups for select using (public.is_admin());
create policy backups_delete_admin on public.project_backups for delete using (public.is_admin());

-- Trigger: alten Stand sichern, bevor er ueberschrieben / in den Papierkorb
-- verschoben / endgueltig geloescht wird. Pro Projekt bleiben die letzten
-- 20 Sicherungen erhalten.
create or replace function public.backup_project()
returns trigger language plpgsql security definer set search_path = public as $$
declare
    v_reason text;
begin
    if tg_op = 'DELETE' then
        v_reason := 'delete';
    elsif old.deleted_at is null and new.deleted_at is not null then
        v_reason := 'trash';
    elsif old.data is distinct from new.data then
        v_reason := 'update';
    else
        return new;   -- z. B. nur Wiederherstellung / Umbenennung -> keine Sicherung noetig
    end if;

    insert into public.project_backups (project_id, user_id, name, project_number, data, reason, saved_at)
    values (old.id, old.user_id, old.name, old.project_number, old.data, v_reason, old.updated_at);

    delete from public.project_backups
     where project_id = old.id
       and id not in (
           select id from public.project_backups
            where project_id = old.id
            order by created_at desc
            limit 20
       );

    if tg_op = 'DELETE' then return old; end if;
    return new;
end;
$$;

drop trigger if exists trg_projects_backup on public.projects;
create trigger trg_projects_backup
    before update or delete on public.projects
    for each row execute function public.backup_project();

-- Haelt updated_at aktuell
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch
    before update on public.projects
    for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 6) Automatisch ein Profil anlegen, sobald sich jemand registriert.
--    Neue Nutzer erhalten sofort 30 Tage Zugang.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    insert into public.profiles (id, email, access_expires_at)
    values (new.id, new.email, now() + interval '30 days')
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7) Freigaben: Projekte mit anderen Nutzern teilen (per E-Mail-Adresse)
--    permission = 'edit'  -> darf das Projekt lesen und speichern (gemeinsam bearbeiten)
--    permission = 'view'  -> darf das Projekt nur ansehen
--    Die Zuordnung erfolgt ueber die E-Mail-Adresse des Auth-Kontos, deshalb muss
--    der Eingeladene nicht vorher registriert sein.
-- ---------------------------------------------------------------------------
create table if not exists public.project_shares (
    id          uuid primary key default gen_random_uuid(),
    project_id  uuid not null references public.projects(id) on delete cascade,
    owner_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
    owner_email text,
    email       text not null,                                   -- eingeladene Adresse (kleingeschrieben)
    permission  text not null default 'view' check (permission in ('view', 'edit')),
    created_at  timestamptz not null default now(),
    unique (project_id, email)
);

create index if not exists idx_shares_email   on public.project_shares(lower(email));
create index if not exists idx_shares_project on public.project_shares(project_id);
alter table public.project_shares enable row level security;

-- Berechtigung des angemeldeten Nutzers fuer ein fremdes Projekt ('edit' | 'view' | null)
-- Hinweis: auth.email() ist keine Standardfunktion aller Supabase-Instanzen;
-- deshalb wird die E-Mail ueber auth.jwt() ->> 'email' ermittelt.
create or replace function public.share_permission(p_project uuid)
returns text
language sql stable security definer set search_path = public as $$
    select s.permission
      from public.project_shares s
     where s.project_id = p_project
       and lower(s.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     order by case s.permission when 'edit' then 0 else 1 end
     limit 1;
$$;

create or replace function public.is_project_owner(p_project uuid)
returns boolean
language sql stable security definer set search_path = public as $$
    select exists (select 1 from public.projects p where p.id = p_project and p.user_id = auth.uid());
$$;

-- Policies fuer project_shares: Eigentuemer verwaltet, Eingeladener sieht seine Zeilen
drop policy if exists shares_select_owner   on public.project_shares;
drop policy if exists shares_insert_owner   on public.project_shares;
drop policy if exists shares_update_owner   on public.project_shares;
drop policy if exists shares_delete_owner   on public.project_shares;
drop policy if exists shares_select_invited on public.project_shares;
drop policy if exists shares_all_admin      on public.project_shares;

create policy shares_select_owner on public.project_shares
    for select using (public.is_active() and public.is_project_owner(project_id));
create policy shares_insert_owner on public.project_shares
    for insert with check (public.is_active() and owner_id = auth.uid() and public.is_project_owner(project_id));
create policy shares_update_owner on public.project_shares
    for update using (public.is_active() and public.is_project_owner(project_id))
              with check (owner_id = auth.uid() and public.is_project_owner(project_id));
create policy shares_delete_owner on public.project_shares
    for delete using (public.is_active() and public.is_project_owner(project_id));
create policy shares_select_invited on public.project_shares
    for select using (public.is_active() and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
create policy shares_all_admin on public.project_shares
    for all using (public.is_admin()) with check (public.is_admin());

-- Geteilte Projekte: Lesen fuer 'view' und 'edit', Speichern nur fuer 'edit'.
-- Eingeladene koennen nichts loeschen oder in den Papierkorb verschieben.
drop policy if exists projects_select_shared on public.projects;
drop policy if exists projects_update_shared on public.projects;

create policy projects_select_shared on public.projects
    for select using (public.is_active() and deleted_at is null and public.share_permission(id) is not null);
create policy projects_update_shared on public.projects
    for update using (public.is_active() and deleted_at is null and public.share_permission(id) = 'edit')
              with check (deleted_at is null and public.share_permission(id) = 'edit');

-- Eigentuemer eines Projekts darf sich durch Bearbeiter nicht aendern lassen
create or replace function public.protect_project_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    if new.user_id is distinct from old.user_id and not public.is_admin() then
        raise exception 'Der Eigentuemer eines Projekts kann nicht geaendert werden.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_projects_protect_owner on public.projects;
create trigger trg_projects_protect_owner
    before update on public.projects
    for each row execute function public.protect_project_owner();

-- ---------------------------------------------------------------------------
-- 8b) Zentrale Geraetebibliothek: EIN Datensatz mit der kompletten Bibliothek
--     (Geraete-Vorlagen, Gruppen, Kabeltypen) als JSON, damit alle Nutzer beim
--     Oeffnen des Tools automatisch denselben aktuellen Stand sehen. Nur Admins
--     duerfen aendern; jeder aktive Nutzer darf lesen. Separates Verwaltungs-
--     tool: geraete-admin.html.
-- ---------------------------------------------------------------------------
create table if not exists public.device_library_state (
    id             boolean primary key default true check (id),
    data           jsonb not null default '{"templates":[],"groups":[],"cableTypes":[]}'::jsonb,
    updated_at     timestamptz not null default now(),
    updated_by     uuid references auth.users(id),
    updated_by_email text
);

alter table public.device_library_state enable row level security;

drop policy if exists device_library_select_active on public.device_library_state;
drop policy if exists device_library_insert_admin  on public.device_library_state;
drop policy if exists device_library_update_admin  on public.device_library_state;

create policy device_library_select_active on public.device_library_state
    for select using (public.is_active());
create policy device_library_insert_admin on public.device_library_state
    for insert with check (public.is_admin());
create policy device_library_update_admin on public.device_library_state
    for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8c) Beitragsfunktion: JEDER aktive Nutzer darf ueber diese Funktion neue
--     Geraete (und ggf. neue Gruppen/Kabeltypen) zur zentralen Bibliothek
--     BEITRAGEN, ohne direktes Schreibrecht auf die Tabelle zu haben. Die
--     Funktion laeuft mit erhoehten Rechten (SECURITY DEFINER), prueft aber
--     selbst is_active() und aendert NUR additiv: bestehende Geraete/Gruppen/
--     Kabeltypen werden nie ueberschrieben oder geloescht, Duplikate (gleicher
--     Name + Artikelnummer) werden uebersprungen. So waechst der Geraetepool
--     automatisch mit jedem neu angelegten Geraet aller Nutzer.
-- ---------------------------------------------------------------------------
create or replace function public.submit_device_to_library(
    p_template jsonb,
    p_group jsonb default null,
    p_cable_types text[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    cur_data jsonb;
    templates jsonb;
    groups jsonb;
    cable_arr jsonb;
    new_key text;
    found boolean;
    item jsonb;
    c text;
begin
    if not public.is_active() then
        raise exception 'Nur aktive Nutzer duerfen Geraete beitragen.';
    end if;
    if p_template is null or coalesce(trim(p_template->>'name'), '') = '' then
        raise exception 'Geraetename fehlt.';
    end if;

    insert into public.device_library_state (id, data)
        values (true, '{"templates":[],"groups":[],"cableTypes":[]}'::jsonb)
        on conflict (id) do nothing;

    select data into cur_data from public.device_library_state where id = true for update;
    templates := coalesce(cur_data->'templates', '[]'::jsonb);
    groups    := coalesce(cur_data->'groups', '[]'::jsonb);
    cable_arr := coalesce(cur_data->'cableTypes', '[]'::jsonb);

    new_key := lower(trim(coalesce(p_template->>'name', ''))) || '|' || lower(trim(coalesce(p_template->>'article', '')));
    found := false;
    for item in select * from jsonb_array_elements(templates) loop
        if lower(trim(coalesce(item->>'name', ''))) || '|' || lower(trim(coalesce(item->>'article', ''))) = new_key then
            found := true;
            exit;
        end if;
    end loop;
    if not found then
        templates := templates || jsonb_build_array(p_template);
    end if;

    if p_group is not null and coalesce(p_group->>'id', '') <> '' then
        found := false;
        for item in select * from jsonb_array_elements(groups) loop
            if item->>'id' = p_group->>'id' then found := true; exit; end if;
        end loop;
        if not found then
            groups := groups || jsonb_build_array(p_group);
        end if;
    end if;

    if p_cable_types is not null then
        foreach c in array p_cable_types loop
            if c is not null and trim(c) <> '' and not (cable_arr ? c) then
                cable_arr := cable_arr || to_jsonb(c);
            end if;
        end loop;
    end if;

    update public.device_library_state
        set data = jsonb_build_object('templates', templates, 'groups', groups, 'cableTypes', cable_arr),
            updated_at = now(),
            updated_by = auth.uid(),
            updated_by_email = auth.jwt() ->> 'email'
        where id = true;
end;
$$;

grant execute on function public.submit_device_to_library(jsonb, jsonb, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 8) DICH als Administrator freischalten.
--    Zuerst ganz normal in der App registrieren und die E-Mail bestaetigen,
--    danach EINMALIG die folgende Zeile mit deiner E-Mail ausfuehren:
-- ---------------------------------------------------------------------------
-- update public.profiles
--    set role = 'admin', blocked = false, access_expires_at = now() + interval '100 years'
--  where email = 'DEINE-ADMIN-EMAIL@example.com';
