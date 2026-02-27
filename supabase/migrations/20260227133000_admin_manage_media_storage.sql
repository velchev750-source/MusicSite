drop policy if exists "Admins can upload media objects" on storage.objects;
create policy "Admins can upload media objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'media'
  and exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can update media objects" on storage.objects;
create policy "Admins can update media objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'media'
  and exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can delete media objects" on storage.objects;
create policy "Admins can delete media objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);
