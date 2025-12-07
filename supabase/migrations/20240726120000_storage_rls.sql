
-- AVATARS BUCKET POLICIES

-- 1. Allow public read access to all files in the 'avatars' bucket.
-- This is necessary for displaying profile pictures to any visitor.
CREATE POLICY "Allow public read on avatars"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload files to the 'avatars' bucket.
-- The file path must be scoped to the user's UID.
-- Example path: public/00000000-0000-0000-0000-000000000000-1678886400000.png
CREATE POLICY "Allow authenticated inserts on avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- 3. Allow authenticated users to update their own files.
-- This includes overwriting an existing avatar.
CREATE POLICY "Allow authenticated updates on own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);


-- 4. Allow authenticated users to delete their own files.
CREATE POLICY "Allow authenticated deletes on own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);
