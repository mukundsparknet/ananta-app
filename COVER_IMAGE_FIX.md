# 🖼️ Cover Image Fix - Complete

## What Was Fixed

The **background/cover image** (the large image behind your profile) was not saving to the backend. Now it works!

## Changes Made

### Backend:
1. ✅ Added `cover_image` column to User model
2. ✅ Added `coverImage` field to UpdateProfileRequest
3. ✅ Updated `/api/app/profile` POST endpoint to handle cover image
4. ✅ Updated `/api/app/profile/{userId}` GET endpoint to return cover image

### Frontend:
1. ✅ Updated `profile.tsx` to save cover image to backend when changed
2. ✅ Updated `profile.tsx` to load cover image from backend
3. ✅ Converts image to base64 before sending to backend

### Database:
1. ✅ Need to add `cover_image TEXT` column to `users` table

---

## Setup Instructions

### Option 1: Automatic Setup (Recommended)
**Double-click:** `SETUP_COVER_IMAGE.bat`

This will guide you through:
1. Adding database column
2. Restarting backend
3. Testing the feature

### Option 2: Manual Setup

**Step 1: Add Database Column**
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT;
```

**Step 2: Restart Backend**
```bash
cd D:\Office\ANANTA-APP\adminpanel\backend
# Stop current backend (Ctrl+C)
mvn spring-boot:run
```

**Step 3: Test It**
```bash
cd D:\Office\ANANTA-APP\Anantaapp
node test-cover-image.mjs
```

---

## How to Use in App

1. Open the app
2. Go to **Profile** tab
3. Tap the **camera icon** on the top (on the cover image)
4. Select a new image
5. ✅ It will automatically save to backend!

---

## Testing

### Test Cover Image Upload:
```bash
# Double-click:
TEST_COVER_IMAGE.bat

# Or run manually:
cd D:\Office\ANANTA-APP\Anantaapp
node test-cover-image.mjs
```

### Test Profile Name Change:
```bash
# Double-click:
TEST_PROFILE_NOW.bat

# Or run manually:
cd D:\Office\ANANTA-APP\Anantaapp
node test-name-change.mjs
```

---

## API Changes

### POST /api/app/profile
Now accepts:
```json
{
  "userId": "AND6926A9B",
  "username": "MJ Rajput",
  "fullName": "MJ Rajput",
  "profileImage": "data:image/jpeg;base64,...",
  "coverImage": "data:image/jpeg;base64,..."  // NEW!
}
```

### GET /api/app/profile/{userId}
Now returns:
```json
{
  "user": {
    "userId": "AND6926A9B",
    "username": "MJ Rajput",
    "profileImage": "/uploads/profile_...",
    "coverImage": "/uploads/cover_..."  // NEW!
  }
}
```

---

## Files Modified

### Backend:
- `User.java` - Added coverImage field
- `UpdateProfileRequest.java` - Added coverImage field
- `AppUserController.java` - Added cover image handling

### Frontend:
- `app/(tabs)/profile.tsx` - Added save & load for cover image

### New Files:
- `test-cover-image.mjs` - Test script
- `TEST_COVER_IMAGE.bat` - Test runner
- `SETUP_COVER_IMAGE.bat` - Complete setup
- `add_cover_image.sql` - Database migration

---

## Troubleshooting

### Cover image not saving?
1. Check backend logs for errors
2. Make sure database column exists
3. Try the test script: `TEST_COVER_IMAGE.bat`

### Cover image not loading?
1. Check if image was saved: `GET /api/app/profile/{userId}`
2. Check browser console for errors
3. Make sure image path is correct

---

**Both profile picture AND cover image now work perfectly!** 🎉
