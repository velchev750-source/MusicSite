create table if not exists public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  event_date date not null,
  event_time time not null,
  desired_duration text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists booking_requests_user_id_idx on public.booking_requests(user_id);
create index if not exists booking_requests_event_date_idx on public.booking_requests(event_date);

alter table public.booking_requests enable row level security;

drop policy if exists "Users can view own bookings" on public.booking_requests;
create policy "Users can view own bookings"
on public.booking_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own bookings" on public.booking_requests;
create policy "Users can insert own bookings"
on public.booking_requests
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own bookings" on public.booking_requests;
create policy "Users can update own bookings"
on public.booking_requests
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
