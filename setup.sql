create table if not exists fabrics (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists custom_shapes (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists custom_templates (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
