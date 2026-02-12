-- NOTE:
-- Ce script concerne Supabase Storage.
-- Si vous utilisez MinIO local (S3_ENDPOINT/S3_BUCKET), ce script n'est pas nécessaire.
-- Conservez-le uniquement si vous revenez à Supabase Storage.

-- Bucket for project gallery images
insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- Read access for public project images
drop policy if exists "project images are public" on storage.objects;
create policy "project images are public"
on storage.objects
for select
to public
using (bucket_id = 'project-images');

-- Authenticated users can upload only inside their own folder (first path segment = auth.uid)
drop policy if exists "authenticated users can upload own project images" on storage.objects;
create policy "authenticated users can upload own project images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'project-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can delete only inside their own folder
drop policy if exists "authenticated users can delete own project images" on storage.objects;
create policy "authenticated users can delete own project images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'project-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
