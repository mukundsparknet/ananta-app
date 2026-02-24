# 🚀 Deployment Instructions for Profile Update Fix

## Problem
Profile update returns 500 Internal Server Error

## Root Cause
The native SQL query in the old code has issues with NULL handling and LOB columns

## Solution Applied
Replaced native query with JPA repository save method

## Files Changed
1. `Anantaapp/config/env.ts` - Fixed API URL (removed trailing slash)
2. `adminpanel/backend/src/main/java/com/ananta/admin/controller/AppUserController.java` - Fixed updateProfile method

## Deployment Steps

### Step 1: Build Backend
```bash
cd D:\Office\ANANTA-APP\adminpanel\backend
mvn clean package -DskipTests
```

### Step 2: Upload to VPS
The JAR file will be in: `target/admin-backend-0.0.1-SNAPSHOT.jar`

Upload this file to your VPS

### Step 3: Restart Backend on VPS
```bash
# Stop old process
pkill -f admin-backend

# Start new process
nohup java -jar admin-backend-0.0.1-SNAPSHOT.jar > backend.log 2>&1 &

# Or if using systemd
sudo systemctl restart ananta-backend
```

### Step 4: Verify Deployment
```bash
# On your local machine
cd D:\Office\ANANTA-APP\Anantaapp
node test-profile-update-live.mjs
```

Expected output: Status 200 with "Profile updated successfully"

## Alternative: Check VPS Logs
If still failing, check logs on VPS:
```bash
tail -f backend.log
# or
journalctl -u ananta-backend -f
```

Look for the line: "ERROR: " followed by the actual error message

## Quick Test Commands
```bash
# Test 1: Check if backend is running
curl https://ecofuelglobal.com/api/app/profile/AN9C263087

# Test 2: Try profile update
curl -X POST https://ecofuelglobal.com/api/app/profile \
  -H "Content-Type: application/json" \
  -d '{"userId":"AN9C263087","username":"Test","fullName":"Test User"}'
```
