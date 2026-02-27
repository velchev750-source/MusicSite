do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'media_type'
      and n.nspname = 'public'
  ) then
    create type public.media_type as enum ('audio', 'video', 'photo');
  end if;
end $$;

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  type public.media_type not null,
  title text not null,
  subtitle text,
  external_url text,
  file_path text,
  thumb_path text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_media_items_updated_at on public.media_items;
create trigger set_media_items_updated_at
before update on public.media_items
for each row
execute function public.set_updated_at();

create index if not exists media_items_type_published_sort_idx
  on public.media_items(type, is_published, sort_order);

alter table public.media_items enable row level security;

drop policy if exists "Public can read published media items" on public.media_items;
create policy "Public can read published media items"
on public.media_items
for select
to anon, authenticated
using (is_published = true);
