drop policy if exists "Admins can read all media items" on public.media_items;
create policy "Admins can read all media items"
on public.media_items
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can insert media items" on public.media_items;
create policy "Admins can insert media items"
on public.media_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update media items" on public.media_items;
create policy "Admins can update media items"
on public.media_items
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

drop policy if exists "Admins can delete media items" on public.media_items;
create policy "Admins can delete media items"
on public.media_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);
