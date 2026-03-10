# Google Authentication Setup Guide

## Prerequisites
1. Google Cloud Console account
2. Android/iOS app configured in Google Cloud Console

## Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API and Google Sign-In API

## Step 2: Configure OAuth 2.0 Credentials

### For Android:
1. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
2. Select "Android" as application type
3. Get your SHA-1 certificate fingerprint:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```
4. Enter package name: `com.ananta.app` (or your actual package name)
5. Enter SHA-1 fingerprint

### For iOS:
1. Create OAuth 2.0 Client ID for iOS
2. Enter your iOS bundle identifier
3. Download the GoogleService-Info.plist file

### For Web:
1. Create OAuth 2.0 Client ID for Web application
2. Add authorized origins:
   - `http://localhost:8081`
   - `http://localhost:19006`
3. Add authorized redirect URIs:
   - `http://localhost:8081`
   - `http://localhost:19006`

## Step 3: Update Configuration Files

### Update GoogleAuthService.ts:
Replace `YOUR_WEB_CLIENT_ID` with your actual Web Client ID from Google Cloud Console.

### Update app.json (for Expo):
```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "iosUrlScheme": "YOUR_REVERSED_CLIENT_ID"
        }
      ]
    ]
  }
}
```

### For Android (android/app/google-services.json):
Download and place the google-services.json file in your android/app directory.

### For iOS (ios/GoogleService-Info.plist):
Download and add GoogleService-Info.plist to your iOS project.

## Step 4: Install Dependencies
Run the installation script:
```bash
./install-google-auth.bat
```

Or manually:
```bash
npm install @react-native-google-signin/google-signin expo-auth-session expo-crypto
```

## Step 5: Test the Integration
1. Start your backend server
2. Start your React Native app
3. Try Google sign-in on the login screen

## Troubleshooting

### Common Issues:
1. **"Sign in failed"**: Check if your Web Client ID is correct
2. **"Play Services not available"**: Make sure Google Play Services is installed on Android device
3. **"Invalid client"**: Verify your package name and SHA-1 fingerprint match

### Debug Steps:
1. Check console logs for detailed error messages
2. Verify your Google Cloud Console configuration
3. Ensure all required APIs are enabled
4. Check if your app's package name matches the one in Google Console

## Security Notes
- Never commit your actual client IDs to version control
- Use environment variables for production
- Regularly rotate your client secrets
- Monitor your Google Cloud Console for unusual activity

## Production Deployment
1. Create production OAuth credentials
2. Update client IDs in your production build
3. Add production domains to authorized origins
4. Test thoroughly before release