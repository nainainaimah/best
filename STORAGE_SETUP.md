# Storage Buckets Setup Guide

This guide explains how to set up Supabase storage buckets for the PostMuse application.

## Automatic Setup (Recommended)

Run the migration to automatically create the storage buckets and RLS policies:

```bash
# Using Supabase CLI
npx supabase db push

# Or if you have Supabase CLI installed globally
supabase db push
```

This will execute the `00003_storage_buckets_setup.sql` migration which:
- Creates `avatars` bucket (2MB limit, images only)
- Creates `uploads` bucket (10MB limit, images and videos)
- Sets up all necessary RLS policies for secure access

## Manual Setup (Alternative)

If you prefer to set up manually or need to troubleshoot:

### 1. Create Avatars Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `avatars`
4. Public bucket: ✅ **Enabled**
5. File size limit: `2097152` (2MB)
6. Allowed MIME types: `image/jpeg, image/jpg, image/png, image/gif, image/webp`

### 2. Create Uploads Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `uploads`
4. Public bucket: ✅ **Enabled**
5. File size limit: `10485760` (10MB)
6. Allowed MIME types: `image/jpeg, image/jpg, image/png, image/gif, image/webp, video/mp4, video/quicktime, video/webm`

### 3. Apply RLS Policies

Run the SQL from `supabase/migrations/00003_storage_buckets_setup.sql` in the SQL Editor.

## Folder Structure

Both buckets use a user-based folder structure:

```
avatars/
  └── {user_id}/
      └── avatar-{timestamp}.{ext}

uploads/
  └── {user_id}/
      └── {timestamp}.{ext}
```

This structure:
- Organizes files by user
- Works with RLS policies for secure access
- Allows users to only access their own files
- Enables easy cleanup per user

## Testing

After setup, test the storage:

1. **Profile Avatar**: Go to Profile → Basic Info → Upload avatar
2. **Post Media**: Go to Create Post → Upload image/video

You should see:
- ✅ Successful upload messages
- ✅ No console errors about "bucket not found"
- ✅ Images/videos display correctly

## Troubleshooting

### "Bucket not found" error

- Verify buckets exist in Supabase Dashboard → Storage
- Check bucket names are exactly `avatars` and `uploads` (lowercase)
- Run the migration again if needed

### Upload fails silently

- Check browser console for detailed error messages
- Verify RLS policies are applied
- Confirm user is authenticated
- Check file size limits (2MB for avatars, 10MB for uploads)

### Images don't display

- Verify buckets are set as **public**
- Check the public URL format is correct
- Ensure CORS is enabled in Supabase (usually automatic for public buckets)

## Security Notes

- RLS policies ensure users can only upload/modify/delete their own files
- Public read access allows anyone to view uploaded images (needed for social media posts)
- File size limits prevent abuse
- MIME type restrictions prevent uploading executable files
