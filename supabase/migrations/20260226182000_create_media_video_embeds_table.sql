create table if not exists public.media_video_embeds (
  id uuid primary key default gen_random_uuid(),
  video_url text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint media_video_embeds_url_check check (video_url ~* '^https?://')
);

create index if not exists media_video_embeds_created_at_idx
  on public.media_video_embeds(created_at desc);

create index if not exists media_video_embeds_is_active_idx
  on public.media_video_embeds(is_active);

alter table public.media_video_embeds enable row level security;

drop policy if exists "Public can read active video embeds" on public.media_video_embeds;
create policy "Public can read active video embeds"
on public.media_video_embeds
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Admins can insert video embeds" on public.media_video_embeds;
create policy "Admins can insert video embeds"
on public.media_video_embeds
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);
