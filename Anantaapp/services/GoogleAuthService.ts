import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { ENV } from '@/config/env';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '276328703341-6hcs2f5fvt3i5lif4o2i9h4uqio3gakb.apps.googleusercontent.com',
  androidClientId: '276328703341-bddjagcvkurna9s05qppc3bev2sfmop1.apps.googleusercontent.com',
  iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with your iOS client ID
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

WebBrowser.maybeCompleteAuthSession();

export class GoogleAuthService {
  static async signIn() {
    try {
      if (Platform.OS === 'web') {
        return await this.signInWeb();
      } else {
        return await this.signInNative();
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  }

  static async signInNative() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      const user = userInfo.user;
      return {
        email: user.email,
        name: user.name,
        profileImage: user.photo,
        id: user.id,
      };
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new Error('Sign in was cancelled');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        throw new Error('Sign in is in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Play services not available');
      } else {
        throw new Error('Something went wrong with sign in');
      }
    }
  }

  static async signInWeb() {
    // For web, use a simpler approach with direct redirect
    const clientId = '276328703341-6hcs2f5fvt3i5lif4o2i9h4uqio3gakb.apps.googleusercontent.com';
    const redirectUri = window.location.origin;
    const scope = 'openid profile email';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `prompt=select_account`;
    
    // Check if we're returning from Google OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // Exchange code for token
      try {
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: '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',
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
          // Get user info
          const userResponse = await fetch(
            `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
          );
          const userInfo = await userResponse.json();
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          return {
            email: userInfo.email,
            name: userInfo.name,
            profileImage: userInfo.picture,
            id: userInfo.id,
          };
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
        throw new Error('Failed to complete Google sign-in');
      }
    } else {
      // Redirect to Google OAuth
      window.location.href = authUrl;
      throw new Error('Redirecting to Google...');
    }
  }

  static async signOut() {
    try {
      if (Platform.OS !== 'web') {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error('Google Sign-Out Error:', error);
    }
  }

  static async authenticateWithBackend(googleUser: any) {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/api/app/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: googleUser.email,
          name: googleUser.name,
          profileImage: googleUser.profileImage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  }
}