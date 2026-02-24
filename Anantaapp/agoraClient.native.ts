import {
  createAgoraRtcEngine,
  RtcEngineContext,
  type IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';

export async function createAgoraEngine(appId: string): Promise<IRtcEngine | null> {
  try {
    const engine = createAgoraRtcEngine();
    const context = new RtcEngineContext();
    context.appId = appId;
    engine.initialize(context);
    return engine;
  } catch {
    return null;
  }
}

export { RtcSurfaceView };
