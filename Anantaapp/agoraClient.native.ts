import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  type IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';

export async function createAgoraEngine(appId: string): Promise<IRtcEngine> {
  console.log('[Native] Creating Agora engine with appId:', appId);
  
  if (!appId || appId === 'undefined' || appId === 'null' || appId.trim() === '') {
    console.error('[Native] Invalid App ID:', appId);
    throw new Error(`Invalid Agora App ID: "${appId}"`);
  }

  const engine = createAgoraRtcEngine();
  console.log('[Native] Engine instance created');
  
  engine.initialize({ 
    appId: appId.trim(),
  });
  
  console.log('[Native] Engine initialized successfully');
  return engine;
}

export { RtcSurfaceView, ChannelProfileType, ClientRoleType };
