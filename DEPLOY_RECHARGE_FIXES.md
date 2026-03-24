# 🚀 Quick Deployment - Recharge History Fixes

## Copy and paste on your server:

```bash
cd /var/www/ANANTA-APP/adminpanel/backend && sudo systemctl stop ananta-backend && sudo pkill -9 java && ./apache-maven-3.9.6/bin/mvn clean package -DskipTests && sudo systemctl start ananta-backend && echo "✅ Backend restarted with fixes!" && sudo journalctl -u ananta-backend -f
```

---

## What this does:

1. ✅ Navigates to backend directory
2. ✅ Stops existing backend
3. ✅ Kills any Java processes
4. ✅ Builds the project with fixes
5. ✅ Starts the backend
6. ✅ Shows logs

---

## Expected Output:

```
[INFO] BUILD SUCCESS
✅ Backend restarted with fixes!
Application timezone set to: Asia/Kolkata
Started AnantaAdminApplication in X.XXX seconds
```

---

## Verify Fixes:

### 1. Check Backend Logs
Look for successful startup message.

### 2. Test Recharge History
Open: http://your-domain.com/recharge-history

### 3. Verify:
- ✅ Usernames display correctly (not "Unknown")
- ✅ Newest recharges at top
- ✅ Fast loading

---

## If Step-by-Step Preferred:

```bash
# Step 1: Navigate and stop
cd /var/www/ANANTA-APP/adminpanel/backend
sudo systemctl stop ananta-backend
sudo pkill -9 java

# Step 2: Build
./apache-maven-3.9.6/bin/mvn clean package -DskipTests

# Step 3: Start
sudo systemctl start ananta-backend

# Step 4: Check logs
sudo journalctl -u ananta-backend -f
```

---

**Press Ctrl+C to exit logs when you see "Started AnantaAdminApplication"**
