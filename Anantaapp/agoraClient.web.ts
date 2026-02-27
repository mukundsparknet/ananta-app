// Real Agora Web SDK implementation
const isBrowser = typeof window !== 'undefined';
let agoraClient: any = null;
let localVideoTrack: any = null;
let localAudioTrack: any = null;
let remoteUsers: Map<number, { videoTrack?: any, audioTrack?: any }> = new Map();
let eventHandlers: any = null;
let AgoraRTC: any = null;
let storedAppId: string = '';
// 1 = broadcaster/host, 2 = audience/viewer — tracked so we never try to publish for viewers
let currentRole: number = 1;

// Version counter so RtcSurfaceView useEffect can detect remote user changes.
// remoteUsers is the same Map reference even after mutations, so the counter
// is the only reliable way to trigger re-renders when a remote user joins.
let remoteUsersVersion = 0;
type RemoteUsersListener = () => void;
const remoteUsersListeners: Set<RemoteUsersListener> = new Set();

function notifyRemoteUsersChanged() {
  remoteUsersVersion++;
  remoteUsersListeners.forEach(fn => fn());
}

export async function createAgoraEngine(appId: string): Promise<any> {
  if (!isBrowser) return null;

  console.log('=== CREATE AGORA ENGINE ===');
  console.log('Received appId:', appId);
  console.log('appId type:', typeof appId);
  console.log('appId length:', appId?.length);
  console.log('===========================');

  // Handle string "undefined" or "null"
  if (!appId || appId === 'undefined' || appId === 'null' || appId.trim() === '') {
    console.error('INVALID APP ID:', appId);
    throw new Error(`Invalid Agora App ID: "${appId}". Please check backend configuration.`);
  }

  storedAppId = appId.trim();
  console.log('Stored appId:', storedAppId);

  if (!AgoraRTC) {
    AgoraRTC = (await import('agora-rtc-sdk-ng')).default;
  }

  agoraClient = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });

  agoraClient.on('user-published', async (user: any, mediaType: string) => {
    console.log(`[Agora] User ${user.uid} published ${mediaType}`);
    await agoraClient!.subscribe(user, mediaType);
    console.log(`[Agora] Subscribed to user ${user.uid} ${mediaType}`);

    if (mediaType === 'video') {
      remoteUsers.set(user.uid as number, {
        ...remoteUsers.get(user.uid as number),
        videoTrack: user.videoTrack
      });
      notifyRemoteUsersChanged();
      console.log(`[Agora] Remote video track added for uid ${user.uid}`);
      eventHandlers?.onUserJoined?.(null, user.uid);
    }
    if (mediaType === 'audio' && user.audioTrack) {
      remoteUsers.set(user.uid as number, {
        ...remoteUsers.get(user.uid as number),
        audioTrack: user.audioTrack
      });
      user.audioTrack.play();
      console.log(`[Agora] Remote audio track playing for uid ${user.uid}`);
    }
  });

  agoraClient.on('user-unpublished', (user: any) => {
    remoteUsers.delete(user.uid as number);
    notifyRemoteUsersChanged();
    eventHandlers?.onUserOffline?.(user.uid);
  });

  return {
    initialize: () => Promise.resolve(),
    enableVideo: async () => {
      // Viewers (audience) don't need camera or mic — skip track creation.
      // Creating them would cause joinChannel to attempt publishing, which
      // Agora forbids for audience and throws before onJoinChannelSuccess fires.
      if (currentRole === 2) return;
      try {
        localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      } catch (error: any) {
        console.error('Camera/Mic access error:', error);
        if (error.code === 'NOT_READABLE') {
          throw new Error('Camera is in use by another app. Please close other apps using camera and try again.');
        }
        throw error;
      }
    },
    setChannelProfile: () => Promise.resolve(),
    setClientRole: async (role: any) => {
      currentRole = role; // 1 = broadcaster, 2 = audience
      await agoraClient?.setClientRole(role === 1 ? 'host' : 'audience');
    },
    startPreview: () => Promise.resolve(),
    registerEventHandler: (handlers: any) => {
      eventHandlers = handlers;
    },
    joinChannel: async (token: string, channelName: string, uid?: number, options?: any) => {
      try {
        const finalAppId = storedAppId || appId;
        console.log('Joining channel:', { appId: finalAppId, channelName, token: token?.substring(0, 20), uid });

        if (!finalAppId || finalAppId === 'undefined' || finalAppId === 'null') {
          throw new Error('App ID is not set. Cannot join channel.');
        }

        await agoraClient?.join(finalAppId, channelName, token || null, uid || null);
        // Only broadcast your own tracks if you are a host.
        // Attempting to publish as audience throws an Agora error before
        // onJoinChannelSuccess fires, leaving the viewer stuck on "Connecting..."
        if (currentRole === 1 && localVideoTrack && localAudioTrack) {
          await agoraClient?.publish([localVideoTrack, localAudioTrack]);
        }
        eventHandlers?.onJoinChannelSuccess?.();
      } catch (error: any) {
        console.error('Join channel error:', error);

        // Check if it's an invalid App ID error
        if (error?.message?.includes('invalid vendor key') || error?.message?.includes('can not find appid')) {
          const helpMessage = 'Invalid Agora App ID. Please:\n' +
            '1. Go to https://console.agora.io/\n' +
            '2. Get your App ID and Certificate\n' +
            '3. Update backend/src/main/resources/application.properties\n' +
            '4. Restart the backend server';
          console.error('\n' + helpMessage);
          eventHandlers?.onError?.(new Error(helpMessage));
        } else {
          eventHandlers?.onError?.(error);
        }
        throw error;
      }
    },
    muteLocalAudioStream: async (mute: boolean) => {
      await localAudioTrack?.setEnabled(!mute);
    },
    switchCamera: async () => {
      // Cycle to next available camera on web
      try {
        const cameras = await AgoraRTC.getCameras();
        if (cameras.length > 1 && localVideoTrack) {
          const currentDeviceId = localVideoTrack.getTrackLabel();
          const currentIndex = cameras.findIndex((c: any) => c.label === currentDeviceId);
          const nextIndex = (currentIndex + 1) % cameras.length;
          await localVideoTrack.setDevice(cameras[nextIndex].deviceId);
        }
      } catch (e) {
        console.warn('Camera switch error:', e);
      }
    },
    leaveChannel: async () => {
      await agoraClient?.leave();
    },
    release: async () => {
      localVideoTrack?.close();
      localAudioTrack?.close();
      localVideoTrack = null;
      localAudioTrack = null;
      remoteUsers.clear();
      notifyRemoteUsersChanged();
      eventHandlers = null;
      currentRole = 1; // reset for next session
    }
  };
}

export function RtcSurfaceView({ canvas, style }: { canvas: { uid: number }, style: any }) {
  if (!isBrowser) return null;

  const React = require('react');
  const containerRef = React.useRef<HTMLDivElement>(null);
  // version state to force re-run of the effect when remote users change
  const [, setVersion] = React.useState(0);

  React.useEffect(() => {
    // Subscribe to remote user changes
    const listener: RemoteUsersListener = () => setVersion(v => v + 1);
    remoteUsersListeners.add(listener);
    return () => { remoteUsersListeners.delete(listener); };
  }, []);

  React.useEffect(() => {
    if (!containerRef.current) return;

    console.log(`[RtcSurfaceView] Rendering for uid ${canvas.uid}, version ${remoteUsersVersion}`);
    console.log(`[RtcSurfaceView] localVideoTrack exists:`, !!localVideoTrack);
    console.log(`[RtcSurfaceView] remoteUsers size:`, remoteUsers.size);
    console.log(`[RtcSurfaceView] remoteUsers keys:`, Array.from(remoteUsers.keys()));

    if (canvas.uid === 0 && localVideoTrack) {
      // Host local preview
      console.log('[RtcSurfaceView] Playing local video track');
      try {
        localVideoTrack.play(containerRef.current);
      } catch (e) {
        console.error('[RtcSurfaceView] Error playing local track:', e);
      }
      return () => { 
        try {
          localVideoTrack?.stop(); 
        } catch (e) {
          console.error('[RtcSurfaceView] Error stopping local track:', e);
        }
      };
    } else if (canvas.uid !== 0) {
      // Viewer watching remote host stream
      const remoteUser = remoteUsers.get(canvas.uid);
      console.log(`[RtcSurfaceView] Looking for remote uid ${canvas.uid}, found:`, !!remoteUser?.videoTrack);
      if (remoteUser?.videoTrack) {
        console.log(`[RtcSurfaceView] Playing remote video for uid ${canvas.uid}`);
        try {
          remoteUser.videoTrack.play(containerRef.current);
        } catch (e) {
          console.error('[RtcSurfaceView] Error playing remote track:', e);
        }
        return () => { 
          try {
            remoteUser?.videoTrack?.stop(); 
          } catch (e) {
            console.error('[RtcSurfaceView] Error stopping remote track:', e);
          }
        };
      } else {
        console.warn(`[RtcSurfaceView] No video track found for uid ${canvas.uid}`);
      }
    }
  }, [canvas.uid, localVideoTrack, remoteUsersVersion]);

  return React.createElement('div', {
    ref: containerRef,
    style: {
      width: '100%',
      height: '100%',
      backgroundColor: '#000',
      ...style
    }
  });
}

export const ChannelProfileType = {
  ChannelProfileLiveBroadcasting: 1
};

export const ClientRoleType = {
  ClientRoleBroadcaster: 1,
  ClientRoleAudience: 2
};
