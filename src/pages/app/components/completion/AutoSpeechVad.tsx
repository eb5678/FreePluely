import { useState, useEffect } from "react";
import { LoaderCircleIcon, SquareIcon } from "lucide-react";
import { Button } from "@/components";
import { useApp } from "@/contexts";
import { UseCompletionReturn } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  microphoneDeviceId?: string;
}

export const AutoSpeechVAD = ({
  submit,
  setState,
  setEnableVAD,
  microphoneDeviceId,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { selectedSttProvider, allSttProviders } = useApp();

  useEffect(() => {
    let unlisten: any;

    const startNativeRecording = async () => {
      try {
        // 1. Listen for the native audio payload from Rust
        unlisten = await listen("speech-detected", async (event: any) => {
          setIsTranscribing(true);

          // Decode raw Base64 audio into WAV
          const base64Audio = event.payload as string;
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: "audio/wav" });

          // Send to STT API via curl
          const { fetchSTT, shouldUsePluelyAPI } = await import("@/lib");
          const usePluelyAPI = await shouldUsePluelyAPI();
          const providerConfig = allSttProviders.find(p => p.id === selectedSttProvider.provider);
          
          if (providerConfig || usePluelyAPI) {
            const text = await fetchSTT({
              provider: usePluelyAPI ? undefined : providerConfig,
              selectedProvider: selectedSttProvider,
              audio: audioBlob,
            });
            if (text) submit(text);
          }
          
          setIsTranscribing(false);
          setEnableVAD(false); // Hide red square, return to mic icon
        });

        // 2. Clear out any other audio captures
        await invoke("stop_system_audio_capture").catch(() => {});

        // 3. Start the Rust audio daemon
        const vadConfig = {
          enabled: false, // Forces continuous manual mode (push to stop)
          max_recording_duration_secs: 180,
          hop_size: 1024, sensitivity_rms: 0.012, peak_threshold: 0.035, silence_chunks: 45, min_speech_chunks: 7, pre_speech_chunks: 12, noise_gate_threshold: 0.003
        };
        
        await invoke("start_system_audio_capture", {
          vadConfig,
          deviceId: microphoneDeviceId && microphoneDeviceId !== "default" ? microphoneDeviceId : null
        });
        
      } catch (err) {
        console.error("Native recording failed:", err);
        setState((prev: any) => ({
          ...prev,
          error: "Native microphone access failed.",
        }));
        setEnableVAD(false);
      }
    };

    startNativeRecording();

    // Cleanup on unmount
    return () => {
      if (unlisten) unlisten();
      invoke("stop_system_audio_capture").catch(() => {});
    };
  }, []);

  // Tell Rust to lock the buffer and send it
  const stopAndSend = async () => {
    await invoke("manual_stop_continuous").catch(() => {});
  };

  if (isTranscribing) {
    return (
      <Button size="icon" disabled className="cursor-not-allowed">
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      onClick={stopAndSend}
      className="cursor-pointer bg-red-100 hover:bg-red-200 text-red-600 animate-pulse border-red-200"
      title="Click to Stop recording and transcribe"
    >
      <SquareIcon className="h-4 w-4" fill="currentColor" />
    </Button>
  );
};