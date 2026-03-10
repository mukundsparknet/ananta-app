# Google Client IDs Configuration

## Replace these in GoogleAuthService.ts:

```typescript
GoogleSignin.configure({
  webClientId: 'XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com',
  androidClientId: 'XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com', 
  iosClientId: 'XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com',
  // ... rest of config
});
```

## Replace in app.json:

```json
"iosUrlScheme": "com.googleusercontent.apps.XXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

## Your Client IDs from Google Cloud Console:

1. **Web Client ID**: `_____________________`
2. **Android Client ID**: `_____________________`  
3. **iOS Client ID**: `_____________________`

## Quick Setup:
1. Copy Client IDs from Google Cloud Console
2. Replace in GoogleAuthService.ts
3. Replace in app.json
4. Download google-services.json for Android