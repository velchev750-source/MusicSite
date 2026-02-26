drop policy if exists "Admins can read all video embeds" on public.media_video_embeds;
create policy "Admins can read all video embeds"
on public.media_video_embeds
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update video embeds" on public.media_video_embeds;
create policy "Admins can update video embeds"
on public.media_video_embeds
for update
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);
