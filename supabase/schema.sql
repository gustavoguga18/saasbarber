create extension if not exists pgcrypto;

create type user_role as enum ('admin','staff');
create type appointment_status as enum ('pending','confirmed','completed','cancelled','no_show');
create type payment_status as enum ('pending','paid','failed','refunded','cancelled');
create type payment_method as enum ('pix','cash','card','online');
create type transaction_type as enum ('income','expense');

create table if not exists establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slogan text,
  address text,
  instagram text,
  whatsapp text,
  timezone text not null default 'America/Fortaleza',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  establishment_id uuid references establishments(id) on delete set null,
  role user_role not null default 'staff',
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now(),
  unique(establishment_id, phone)
);

create table if not exists working_hours (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  weekday integer not null check (weekday between 0 and 6),
  open_time time,
  close_time time,
  active boolean not null default true,
  unique(establishment_id, weekday)
);

create table if not exists blocked_dates (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  blocked_date date not null,
  reason text,
  unique(establishment_id, blocked_date)
);

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  service_id uuid not null references services(id),
  customer_id uuid not null references customers(id),
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status appointment_status not null default 'pending',
  price numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  method payment_method not null,
  status payment_status not null default 'pending',
  external_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists financial_transactions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references establishments(id) on delete cascade,
  appointment_id uuid references appointments(id) on delete set null,
  type transaction_type not null,
  amount numeric(10,2) not null check (amount >= 0),
  description text,
  transaction_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists appointments_date_idx on appointments(establishment_id, appointment_date);
create index if not exists appointments_customer_idx on appointments(customer_id);

create unique index if not exists appointments_active_slot_idx
on appointments(establishment_id, appointment_date, start_time)
where status in ('pending','confirmed');

alter table establishments enable row level security;
alter table profiles enable row level security;
alter table services enable row level security;
alter table customers enable row level security;
alter table working_hours enable row level security;
alter table blocked_dates enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;
alter table financial_transactions enable row level security;

create policy "public active services"
on services for select
using (active = true);

create policy "public active establishments"
on establishments for select
using (active = true);

create policy "public working hours"
on working_hours for select
using (active = true);

create policy "users read own profile"
on profiles for select
using (auth.uid() = id);

-- O cadastro de agendamentos é feito pela API server-side com service role.
-- Não exponha SUPABASE_SERVICE_ROLE_KEY ao navegador.

insert into establishments (name,slogan,address,instagram,whatsapp)
select 'Yago Barbershop',
'𝑪𝑼𝑰𝑫𝑨 𝑽𝑬𝑴 𝑫𝑬𝑰𝑿𝑨𝑹 𝑻𝑬𝑼 𝑪𝑨𝑩𝑬𝑳𝑶 𝑵𝑨 𝑹𝑬́𝑮𝑼𝑨 💈',
'Rua Bom Jesus 957',
'https://www.instagram.com/yago_barberr/',
'85986016629'
where not exists (select 1 from establishments where name='Yago Barbershop');

-- Depois de executar, crie os serviços desejados no painel/SQL.
