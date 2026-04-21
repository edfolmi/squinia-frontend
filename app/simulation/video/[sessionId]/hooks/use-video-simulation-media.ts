"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type MediaSimError =
  | "camera_denied"
  | "camera_not_found"
  | "camera_unknown"
  | "screen_denied"
  | "screen_cancelled"
  | "screen_not_supported"
  | "record_not_supported"
  | "record_failed"
  | null;

function errorMessage(code: MediaSimError): string | null {
  switch (code) {
    case "camera_denied":
      return "Camera or microphone access was denied. Allow access in your browser settings, then try again.";
    case "camera_not_found":
      return "No camera or microphone was found on this device.";
    case "camera_unknown":
      return "Could not start camera. Check that another app is not using it.";
    case "screen_denied":
      return "Screen sharing was blocked. Allow screen capture for this site if prompted.";
    case "screen_cancelled":
      return "Screen share was cancelled.";
    case "screen_not_supported":
      return "Screen sharing is not supported in this browser.";
    case "record_not_supported":
      return "Recording is not supported for this media type in your browser.";
    case "record_failed":
      return "Recording stopped unexpectedly. Try starting again.";
    default:
      return null;
  }
}

function pickRecorderMime(): string | undefined {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

/**
 * Builds one MediaStream for MediaRecorder: one video track (screen if active, else camera)
 * and one mixed audio track (mic + optional display audio) via AudioContext.
 */
function buildRecordableStream(
  camera: MediaStream | null,
  screen: MediaStream | null,
  audioCtx: AudioContext,
): MediaStream | null {
  const out = new MediaStream();

  const screenVideo = screen?.getVideoTracks()[0];
  const cameraVideo = camera?.getVideoTracks()[0];
  const videoTrack = screenVideo ?? cameraVideo;
  if (videoTrack) {
    out.addTrack(videoTrack);
  }

  const dest = audioCtx.createMediaStreamDestination();
  let hasAudio = false;

  const micTrack = camera?.getAudioTracks()[0];
  if (micTrack) {
    try {
      audioCtx.createMediaStreamSource(new MediaStream([micTrack])).connect(dest);
      hasAudio = true;
    } catch {
      /* ignore */
    }
  }

  screen?.getAudioTracks().forEach((t) => {
    try {
      audioCtx.createMediaStreamSource(new MediaStream([t])).connect(dest);
      hasAudio = true;
    } catch {
      /* ignore */
    }
  });

  const mixed = dest.stream.getAudioTracks()[0];
  if (mixed && hasAudio) {
    out.addTrack(mixed);
  }

  if (out.getTracks().length === 0) return null;
  return out;
}

export type UseVideoSimulationMediaOptions = {
  /** Called when a recording completes (Blob in memory — wire to upload later). */
  onRecordingComplete?: (blob: Blob) => void;
};

export function useVideoSimulationMedia(options: UseVideoSimulationMediaOptions = {}) {
  const { onRecordingComplete } = options;

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<MediaSimError>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  /** Latest streams for unmount cleanup (avoids stale closure). */
  const streamsRef = useRef<{ cam: MediaStream | null; scr: MediaStream | null }>({
    cam: null,
    scr: null,
  });

  useEffect(() => {
    streamsRef.current = { cam: cameraStream, scr: screenStream };
  }, [cameraStream, screenStream]);

  const clearError = useCallback(() => setError(null), []);

  /** Stops MediaRecorder; `onstop` clears ref and `recording` unless stop throws. */
  const stopRecorder = useCallback(() => {
    const r = recorderRef.current;
    if (!r) {
      setRecording(false);
      return;
    }
    if (r.state === "inactive") {
      recorderRef.current = null;
      setRecording(false);
      return;
    }
    try {
      r.stop();
    } catch {
      recorderRef.current = null;
      setRecording(false);
    }
  }, []);

  const disposeAudioContext = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state !== "closed") {
      void ctx.close();
    }
    audioCtxRef.current = null;
  }, []);

  const stopCamera = useCallback(() => {
    stopRecorder();
    window.setTimeout(() => {
      setCameraStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    }, 160);
  }, [stopRecorder]);

  const stopScreen = useCallback(() => {
    stopRecorder();
    window.setTimeout(() => {
      setScreenStream((prev) => {
        prev?.getTracks().forEach((t) => t.stop());
        return null;
      });
    }, 160);
  }, [stopRecorder]);

  const startCamera = useCallback(async () => {
    clearError();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("camera_not_found");
      return;
    }
    stopRecorder();
    await new Promise((resolve) => {
      window.setTimeout(resolve, 120);
    });
    setCameraStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });
      setCameraStream(stream);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("camera_denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("camera_not_found");
      } else {
        setError("camera_unknown");
      }
    }
  }, [clearError, stopRecorder]);

  const startScreenShare = useCallback(async () => {
    clearError();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
      setError("screen_not_supported");
      return;
    }
    stopRecorder();
    await new Promise((resolve) => {
      window.setTimeout(resolve, 120);
    });
    setScreenStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          setScreenStream((s) => {
            if (!s) return null;
            s.getTracks().forEach((t) => t.stop());
            return null;
          });
        });
      }
      setScreenStream(stream);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("screen_denied");
      } else if (err.name === "AbortError") {
        setError("screen_cancelled");
      } else {
        setError("screen_cancelled");
      }
    }
  }, [clearError, stopRecorder]);

  const startRecording = useCallback(async () => {
    clearError();
    if (!cameraStream && !screenStream) {
      setError("camera_unknown");
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setError("record_not_supported");
      return;
    }

    stopRecorder();
    await new Promise((resolve) => {
      window.setTimeout(resolve, 120);
    });
    chunksRef.current = [];

    const mime = pickRecorderMime();

    const AudioContextCtor =
      typeof window !== "undefined"
        ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
        : undefined;
    if (!AudioContextCtor) {
      setError("record_not_supported");
      return;
    }

    disposeAudioContext();
    const audioCtx = new AudioContextCtor();
    audioCtxRef.current = audioCtx;
    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    const recordStream = buildRecordableStream(cameraStream, screenStream, audioCtx);
    if (!recordStream) {
      disposeAudioContext();
      setError("record_failed");
      return;
    }

    try {
      const rec =
        mime !== undefined
          ? new MediaRecorder(recordStream, { mimeType: mime })
          : new MediaRecorder(recordStream);
      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunksRef.current.push(ev.data);
        }
      };
      rec.onerror = () => {
        setError("record_failed");
        setRecording(false);
        recorderRef.current = null;
        disposeAudioContext();
      };
      rec.onstop = () => {
        const blobType = mime?.split(";")[0] || rec.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];
        setRecordedBlob(blob);
        onRecordingComplete?.(blob);
        setRecording(false);
        recorderRef.current = null;
        disposeAudioContext();
      };
      rec.start(250);
      setRecording(true);
    } catch {
      disposeAudioContext();
      recorderRef.current = null;
      setError("record_failed");
    }
  }, [
    cameraStream,
    screenStream,
    clearError,
    stopRecorder,
    disposeAudioContext,
    onRecordingComplete,
  ]);

  const stopRecording = useCallback(() => {
    stopRecorder();
  }, [stopRecorder]);

  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
  }, []);

  /** Re-wrap tracks in a new MediaStream so React updates bound `<video>` elements. */
  const toggleCameraVideo = useCallback(() => {
    setCameraStream((prev) => {
      if (!prev) return prev;
      const t = prev.getVideoTracks()[0];
      if (t) t.enabled = !t.enabled;
      return new MediaStream(prev.getTracks());
    });
  }, []);

  const toggleCameraMic = useCallback(() => {
    setCameraStream((prev) => {
      if (!prev) return prev;
      const t = prev.getAudioTracks()[0];
      if (t) t.enabled = !t.enabled;
      return new MediaStream(prev.getTracks());
    });
  }, []);

  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
      streamsRef.current.cam?.getTracks().forEach((t) => t.stop());
      streamsRef.current.scr?.getTracks().forEach((t) => t.stop());
      const ctx = audioCtxRef.current;
      if (ctx && ctx.state !== "closed") {
        void ctx.close();
      }
      audioCtxRef.current = null;
    };
  }, []);

  return {
    cameraStream,
    screenStream,
    recording,
    recordedBlob,
    error,
    errorMessage: errorMessage(error),
    clearError,
    startCamera,
    stopCamera,
    startScreenShare,
    stopScreen,
    startRecording,
    stopRecording,
    discardRecording,
    toggleCameraVideo,
    toggleCameraMic,
  };
}
