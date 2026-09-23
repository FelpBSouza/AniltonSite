-- Run after schema.sql to support the administrator panel.
-- Original files stay private; previews are public and watermarked in production.

insert into storage.buckets (id, name, public)
values ('photo-previews', 'photo-previews', true)
on conflict (id) do update set public = true;

create policy "Anyone can read published previews"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'photo-previews'
  and exists (
    select 1
    from public.photos
    join public.albums on albums.id = photos.album_id
    where photos.preview_path = storage.objects.name
      and photos.is_published = true
      and albums.is_published = true
  )
);

create policy "Admins manage photo previews"
on storage.objects for all
to authenticated
using (bucket_id = 'photo-previews' and public.is_admin())
with check (bucket_id = 'photo-previews' and public.is_admin());
