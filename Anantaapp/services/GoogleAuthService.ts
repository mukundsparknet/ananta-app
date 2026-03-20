import { Platform } from 'react-native';
import { ENV } from '@/config/env';

const WEB_CLIENT_ID = '276328703341-6hcs2f5fvt3i5lif4o2i9h4uqio3gakb.apps.googleusercontent.com';

// ─── Native (Android/iOS) ────────────────────────────────────────────────────
async function signInNative() {
  const { GoogleSignin, statusCodes } = await import('@react-native-google-signin/google-signin');
  const { getApp } = await import('@react-native-firebase/app');
  const { getAuth, GoogleAuthProvider, signInWithCredential } = await import('@react-native-firebase/auth');

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
  });

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Force account picker to show every time
  await GoogleSignin.signOut();

  const signInResult = await GoogleSignin.signIn();
  const idToken = signInResult.data?.idToken;

  if (!idToken) throw new Error('No ID token received from Google');

  const credential = GoogleAuthProvider.credential(idToken);
  const auth = getAuth(getApp());
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;

  return {
    email: user.email ?? '',
    name: user.displayName ?? '',
    profileImage: user.photoURL ?? '',
    id: user.uid,
  };
}

// ─── Web ─────────────────────────────────────────────────────────────────────
async function signInWeb() {
  const AuthSession = await import('expo-auth-session');
  const WebBrowser = await import('expo-web-browser');

  WebBrowser.maybeCompleteAuthSession();

  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'com.techvivek32.ananta' });

  const request = new AuthSession.AuthRequest({
    clientId: WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    usePKCE: true,
  });

  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };

  const result = await request.promptAsync(discovery);
  if (result.type !== 'success') throw new Error('Sign in cancelled');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: WEB_CLIENT_ID,
      code: result.params.code,
      code_verifier: request.codeVerifier ?? '',
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }).toString(),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) throw new Error(tokenData.error_description || 'No access token');

  const userRes = await fetch(
    `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
  );
  const user = await userRes.json();

  return {
    email: user.email ?? '',
    name: user.name ?? '',
    profileImage: user.picture ?? '',
    id: user.id ?? '',
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────
export class GoogleAuthService {
  static async signIn() {
    return Platform.OS === 'web' ? signInWeb() : signInNative();
  }

  static async signOut() {
    if (Platform.OS !== 'web') {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const { getApp } = await import('@react-native-firebase/app');
      const { getAuth, signOut } = await import('@react-native-firebase/auth');
      await GoogleSignin.signOut();
      await signOut(getAuth(getApp()));
    }
  }

  static async authenticateWithBackend(googleUser: {
    email: string;
    name: string;
    profileImage: string;
    id?: string;
  }) {
    const response = await fetch(`${ENV.API_BASE_URL}/api/app/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: googleUser.email,
        name: googleUser.name,
        profileImage: googleUser.profileImage,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Authentication failed');
    }

    return response.json();
  }
}
