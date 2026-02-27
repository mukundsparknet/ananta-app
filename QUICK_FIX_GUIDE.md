## 🎯 QUICK FIX - 2 MINUTES

Your test file works because it uses App ID: **b6bbf782efa94f8b9894e9b5c1895dfa**

Your backend doesn't work because it uses App ID: **ae6f0f0e29904fa88c92b1d52b98acc5**

### ✅ SOLUTION (Choose One):

---

## Option 1: Get Certificate (RECOMMENDED)

1. Go to: https://console.agora.io/
2. Login with your account
3. Find project with App ID: `b6bbf782efa94f8b9894e9b5c1895dfa`
4. Click "Config" or "Settings"
5. Copy the "Primary Certificate" (32 hex characters)
6. Open: `adminpanel/backend/src/main/resources/application.properties`
7. Replace `YOUR_CERTIFICATE_HERE` with your certificate
8. Restart backend

---

## Option 2: Disable Token (TESTING ONLY - NOT SECURE)

If you can't find certificate, temporarily disable tokens:

### Step 1: Update Agora Console
1. Go to https://console.agora.io/
2. Open your project (App ID: b6bbf782efa94f8b9894e9b5c1895dfa)
3. Go to "Config" → "Features"
4. Set "App Certificate" to **DISABLED** or "Testing Mode"

### Step 2: Update Backend Code

Open: `adminpanel/backend/src/main/java/com/ananta/admin/service/AgoraTokenService.java`

Find the `buildRtcToken` method and change it to:

```java
public String buildRtcToken(String channelName, int uid, int role) {
    // Temporary: Return null to disable token authentication
    // WARNING: Only use for testing! Enable certificate for production
    return null;
}
```

### Step 3: Restart Backend
```bash
cd adminpanel/backend
./mvnw spring-boot:run
```

---

## ⚡ FASTEST FIX (If you know the certificate)

Just run this command:

**Windows:**
```cmd
cd adminpanel\backend\src\main\resources
notepad application.properties
```

**Change this line:**
```
agora.certificate=YOUR_CERTIFICATE_HERE
```

**To:**
```
agora.certificate=YOUR_ACTUAL_32_CHAR_CERTIFICATE
```

**Save and restart backend.**

---

## 🔍 How to Find Your Certificate

1. Open browser
2. Go to: https://console.agora.io/projects
3. You'll see your project with App ID starting with `b6bbf782...`
4. Click on it
5. Look for "Primary Certificate" - it's a 32-character string like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
6. Copy it
7. Paste in `application.properties`

---

**After fixing, your live streaming will work immediately!** 🚀
