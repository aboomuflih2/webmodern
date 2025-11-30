create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  cover_image text,
  display_mode text not null default 'grid',
  type text,
  related_event_id uuid,
  status text not null default 'published',
  published_at timestamp with time zone default now(),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table if exists public.gallery_photos
  add column if not exists album_id uuid,
  add column if not exists caption text,
  add column if not exists sort_order integer default 0,
  add column if not exists is_active boolean default true;

alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

drop policy if exists gallery_albums_public_select on public.gallery_albums;
create policy gallery_albums_public_select on public.gallery_albums
  for select
  using (status = 'published' and is_active = true);

drop policy if exists gallery_photos_public_select on public.gallery_photos;
create policy gallery_photos_public_select on public.gallery_photos
  for select
  using (coalesce(is_active, true) = true);

drop policy if exists gallery_albums_admin_write on public.gallery_albums;
create policy gallery_albums_admin_write on public.gallery_albums
  for all
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists gallery_photos_admin_write on public.gallery_photos;
create policy gallery_photos_admin_write on public.gallery_photos
  for all
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );
