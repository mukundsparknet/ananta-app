# 🚀 QUICK START - Fix Cover Image

## Problem
The background/cover image (large image behind profile) was not saving to backend.

## Solution - 3 Easy Steps

### Step 1: Add Database Column ⚡
Open PostgreSQL and run:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT;
```

### Step 2: Restart Backend 🔄
```bash
cd D:\Office\ANANTA-APP\adminpanel\backend
# Press Ctrl+C to stop current backend
mvn spring-boot:run
```

### Step 3: Test It ✅
Double-click: **`TEST_COMPLETE_PROFILE.bat`**

---

## OR Use the Menu

Double-click: **`FIX_COVER_IMAGE_MENU.bat`**

This gives you a menu to:
1. Show SQL command
2. Restart backend
3. Test cover image
4. Test everything

---

## What's Fixed?

✅ Profile name changes work  
✅ Profile picture (small circle) works  
✅ Cover image (background) works - **NEWLY FIXED!**  
✅ All changes save to backend  
✅ All changes persist across sessions  

---

## Test Scripts

| File | What It Does |
|------|--------------|
| `FIX_COVER_IMAGE_MENU.bat` | ⭐ Interactive menu |
| `TEST_COMPLETE_PROFILE.bat` | Test name + cover |
| `TEST_COVER_IMAGE.bat` | Test cover only |
| `TEST_PROFILE_NOW.bat` | Test name only |

---

## Need Help?

Read the detailed guides:
- `PROFILE_FEATURES_COMPLETE.md` - Complete overview
- `COVER_IMAGE_FIX.md` - Cover image details
- `TEST_INSTRUCTIONS.md` - Testing guide

---

**That's it! 3 steps and you're done!** 🎉
