create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

drop policy if exists "Admins can read own role" on public.admins;
create policy "Admins can read own role"
on public.admins
for select
to authenticated
using (auth.uid() = user_id);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages(created_at desc);

alter table public.contact_messages enable row level security;

drop policy if exists "Anyone can insert contact messages" on public.contact_messages;
create policy "Anyone can insert contact messages"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read all contact messages" on public.contact_messages;
create policy "Admins can read all contact messages"
on public.contact_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can read all inquiries" on public.booking_inquiries;
create policy "Admins can read all inquiries"
on public.booking_inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.user_id = auth.uid()
  )
);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
