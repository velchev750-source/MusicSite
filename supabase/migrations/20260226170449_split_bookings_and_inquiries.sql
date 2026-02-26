create table if not exists public.booking_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_date date not null,
  event_time time not null,
  desired_duration text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'rejected')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists booking_inquiries_user_id_idx on public.booking_inquiries(user_id);
create index if not exists booking_inquiries_event_date_idx on public.booking_inquiries(event_date);

insert into public.booking_inquiries (id, user_id, event_type, event_date, event_time, desired_duration, status, created_at, cancelled_at)
select id, user_id, event_type, event_date, event_time, desired_duration, status, created_at, cancelled_at
from public.booking_requests
on conflict (id) do nothing;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid references public.booking_inquiries(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists bookings_start_at_idx on public.bookings(start_at);
create index if not exists bookings_end_at_idx on public.bookings(end_at);

create extension if not exists btree_gist;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_no_time_overlap'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
    add constraint bookings_no_time_overlap
    exclude using gist (tstzrange(start_at, end_at, '[)') with &&);
  end if;
end $$;

alter table public.booking_inquiries enable row level security;
alter table public.bookings enable row level security;

drop policy if exists "Users can read own inquiries" on public.booking_inquiries;
create policy "Users can read own inquiries"
on public.booking_inquiries
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own inquiries" on public.booking_inquiries;
create policy "Users can insert own inquiries"
on public.booking_inquiries
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own inquiries" on public.booking_inquiries;
create policy "Users can update own inquiries"
on public.booking_inquiries
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Anyone can read bookings" on public.bookings;
create policy "Anyone can read bookings"
on public.bookings
for select
to anon, authenticated
using (true);
