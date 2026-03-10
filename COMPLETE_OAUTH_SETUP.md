# Complete Google OAuth Setup Guide

## 1. Web Application Client

**Application type:** Web application
**Name:** ANANTA Web Client

**Authorized JavaScript origins:**
- http://localhost:8081
- http://localhost:19006
- http://localhost:3000

**Authorized redirect URIs:**
- http://localhost:8081
- http://localhost:19006
- http://localhost:3000
- http://localhost:8081/auth/callback
- http://localhost:19006/auth/callback

## 2. Android Application Client

**Application type:** Android
**Name:** ANANTA Android Client
**Package name:** com.techvivek32.Ananta
**SHA-1 certificate fingerprint:** [Get from command below]

### Get SHA-1 fingerprint:
```bash
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## 3. iOS Application Client

**Application type:** iOS
**Name:** ANANTA iOS Client
**Bundle ID:** com.techvivek32.Ananta

## After Creating All Clients:

1. **Copy Web Client ID** → Replace in GoogleAuthService.ts
2. **Copy Android Client ID** → Replace in GoogleAuthService.ts
3. **Copy iOS Client ID** → Replace in GoogleAuthService.ts
4. **Copy iOS Client ID** → Replace in app.json (iosUrlScheme)

## Example Client IDs Format:
```
123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

## Update Code:
```typescript
// GoogleAuthService.ts
webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
```

```json
// app.json
"iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
```