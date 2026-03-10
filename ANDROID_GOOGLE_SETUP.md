# Android Google Authentication Setup

## Step 1: Get SHA-1 Certificate Fingerprint

### For Debug Build:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

### For Windows:
```bash
keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

## Step 2: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**

### Create Android OAuth Client:
- Application type: **Android**
- Package name: `com.techvivek32.Ananta`
- SHA-1 certificate fingerprint: (paste from Step 1)

### Create Web OAuth Client:
- Application type: **Web application**
- Authorized origins: `http://localhost:8081`, `http://localhost:19006`
- Authorized redirect URIs: `http://localhost:8081`, `http://localhost:19006`

## Step 3: Download google-services.json

1. In Google Cloud Console, go to **Project Settings**
2. Download `google-services.json`
3. Place it in: `d:\Office\ANANTA-APP\Anantaapp\google-services.json`

## Step 4: Update Configuration

### Update GoogleAuthService.ts:
```typescript
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  // ... other config
});
```

## Step 5: Test on Android

```bash
cd d:\Office\ANANTA-APP\Anantaapp
npm run android
```

## Troubleshooting

### "Sign in failed" Error:
- Verify SHA-1 fingerprint matches
- Check package name is correct
- Ensure google-services.json is in root directory

### "Play Services not available":
- Update Google Play Services on device
- Use real device instead of emulator

### "Invalid client" Error:
- Verify Android client ID is correct
- Check google-services.json is properly configured