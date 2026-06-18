import { useCallback, useRef, useState } from "react";
import { reportError } from "@/shared/lib/reportError";

function pickMimeType(): string | undefined {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useSessionRecording() {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback((stream: MediaStream) => {
    if (recording || recorderRef.current) return false;

    try {
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.start(1000);
      recorderRef.current = recorder;
      setRecording(true);
      return true;
    } catch (err) {
      reportError("Recording start error", err);
      return false;
    }
  }, [recording]);

  const stopRecording = useCallback((download = true) => {
    const recorder = recorderRef.current;
    if (!recorder) {
      setRecording(false);
      return;
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
      if (download && blob.size > 0) {
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        downloadBlob(blob, `crowdnav-recording-${stamp}.webm`);
      }
      chunksRef.current = [];
      recorderRef.current = null;
      setRecording(false);
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      recorderRef.current = null;
      setRecording(false);
    }
  }, []);

  const toggleRecording = useCallback((stream: MediaStream | null) => {
    if (recording) {
      stopRecording(true);
      return;
    }
    if (!stream) return;
    startRecording(stream);
  }, [recording, startRecording, stopRecording]);

  return { recording, startRecording, stopRecording, toggleRecording };
}
