"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PhoneAudioError = "mic_denied" | "mic_not_found" | "mic_unknown" | "record_not_supported" | "record_failed" | null;

function errorMessage(code: PhoneAudioError): string | null {
  switch (code) {
    case "mic_denied":
      return "Microphone access was denied. Allow access in your browser settings to record this call.";
    case "mic_not_found":
      return "No microphone was found on this device.";
    case "mic_unknown":
      return "Could not start the microphone. Check that another app is not using it.";
    case "record_not_supported":
      return "Audio recording is not supported in this browser.";
    case "record_failed":
      return "Recording stopped unexpectedly.";
    default:
      return null;
  }
}

function pickAudioMime(): string | undefined {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
  for (const t of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) {
      return t;
    }
  }
  return undefined;
}

/**
 * Browser-native mic capture + MediaRecorder for the phone simulation “voice pipeline”.
 * Recording runs while the call is live; finalize before navigating to the report.
 */
export function usePhoneSimulationAudio() {
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<PhoneAudioError>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordedBlobRef = useRef<Blob | null>(null);
  const skipNextBlobRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    streamRef.current = micStream;
  }, [micStream]);

  const clearError = useCallback(() => setError(null), []);

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

  const stopMicTracks = useCallback(() => {
    setMicStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  /** End call: stop capture and discard the in-progress file. */
  const resetPipeline = useCallback(() => {
    skipNextBlobRef.current = true;
    stopRecorder();
    window.setTimeout(() => {
      stopMicTracks();
      recordedBlobRef.current = null;
      setRecordedBlob(null);
      chunksRef.current = [];
      skipNextBlobRef.current = false;
    }, 120);
  }, [stopRecorder, stopMicTracks]);

  const startPipeline = useCallback(async () => {
    clearError();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("mic_not_found");
      return;
    }
    skipNextBlobRef.current = false;
    stopRecorder();
    stopMicTracks();
    await new Promise((r) => {
      window.setTimeout(r, 140);
    });
    chunksRef.current = [];
    recordedBlobRef.current = null;
    setRecordedBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      setMicStream(stream);

      if (typeof MediaRecorder === "undefined") {
        setError("record_not_supported");
        stream.getTracks().forEach((t) => t.stop());
        setMicStream(null);
        return;
      }

      const mime = pickAudioMime();
      let rec: MediaRecorder;
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        setError("record_not_supported");
        stream.getTracks().forEach((t) => t.stop());
        setMicStream(null);
        return;
      }

      recorderRef.current = rec;
      rec.ondataavailable = (ev) => {
        if (ev.data?.size) chunksRef.current.push(ev.data);
      };
      rec.onerror = () => {
        setError("record_failed");
        setRecording(false);
        recorderRef.current = null;
      };
      rec.onstop = () => {
        const blobType = mime?.split(";")[0] || rec.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: blobType });
        chunksRef.current = [];
        recorderRef.current = null;
        setRecording(false);
        if (skipNextBlobRef.current) {
          skipNextBlobRef.current = false;
          recordedBlobRef.current = null;
          setRecordedBlob(null);
          return;
        }
        recordedBlobRef.current = blob;
        setRecordedBlob(blob);
      };
      rec.start(250);
      setRecording(true);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setError("mic_denied");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setError("mic_not_found");
      } else {
        setError("mic_unknown");
      }
    }
  }, [clearError, stopRecorder, stopMicTracks]);

  const finalizeRecording = useCallback(async (): Promise<Blob | null> => {
    skipNextBlobRef.current = false;
    const r = recorderRef.current;
    if (r && r.state !== "inactive") {
      try {
        r.stop();
      } catch {
        recorderRef.current = null;
        setRecording(false);
      }
    }
    for (let i = 0; i < 60; i++) {
      await new Promise((res) => {
        window.setTimeout(res, 50);
      });
      const b = recordedBlobRef.current;
      if (b && b.size > 0) return b;
      if (!recorderRef.current && i > 4) break;
    }
    const b = recordedBlobRef.current;
    return b && b.size > 0 ? b : null;
  }, []);

  useEffect(() => {
    return () => {
      try {
        recorderRef.current?.stop();
      } catch {
        /* ignore */
      }
      recorderRef.current = null;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return {
    micStream,
    recording,
    recordedBlob,
    error,
    errorMessage: errorMessage(error),
    clearError,
    startPipeline,
    resetPipeline,
    finalizeRecording,
  };
}
