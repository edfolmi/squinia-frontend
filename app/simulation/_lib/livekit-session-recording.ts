"use client";

type LiveKitRecordingController = {
  finalize: () => Promise<Blob | null>;
  dispose: (options?: { discard?: boolean }) => Promise<void> | void;
};

const controllers = new Map<string, LiveKitRecordingController>();

export function registerLiveKitRecordingController(
  sessionId: string,
  controller: LiveKitRecordingController,
) {
  controllers.set(sessionId, controller);
}

export function unregisterLiveKitRecordingController(
  sessionId: string,
  controller: LiveKitRecordingController,
) {
  if (controllers.get(sessionId) === controller) {
    controllers.delete(sessionId);
  }
}

export async function finalizeLiveKitRecording(sessionId: string): Promise<Blob | null> {
  const controller = controllers.get(sessionId);
  if (!controller) return null;
  return controller.finalize();
}

export async function disposeLiveKitRecording(sessionId: string) {
  const controller = controllers.get(sessionId);
  if (!controller) return;
  controllers.delete(sessionId);
  await controller.dispose({ discard: true });
}
