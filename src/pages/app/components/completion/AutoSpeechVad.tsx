import { useState, useEffect } from "react";
import { LoaderCircleIcon, MicOffIcon } from "lucide-react";
import { Button } from "@/components";
import { useApp } from "@/contexts";
import { fetchSTT, shouldUsePluelyAPI } from "@/lib";
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
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const { selectedSttProvider, allSttProviders } = useApp();

  useEffect(() => {
    let unlistenSpeechDetected: any;
    let unlistenSpeechStart: any;

    const startNativeVAD = async () => {
      try {
        // 1. Rust tells us the user started talking
        unlistenSpeechStart = await listen("speech-start", () => {
          setIsUserSpeaking(true);
        });

        // 2. Rust tells us the user finished talking and hands us the audio
        unlistenSpeechDetected = await listen("speech-detected", async (event: any) => {
          setIsUserSpeaking(false);
          setIsTranscribing(true);

          const base64Audio = event.payload as string;
          const binaryString = atob(base64Audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: "audio/wav" });

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
        });

        // 3. Clear conflicting audio requests
        await invoke("stop_system_audio_capture").catch(() => {});

        // 4. Start the Rust audio daemon with VAD ENABLED
        const vadConfig = {
          enabled: true, 
          max_recording_duration_secs: 180,
          hop_size: 1024, sensitivity_rms: 0.012, peak_threshold: 0.035, silence_chunks: 45, min_speech_chunks: 7, pre_speech_chunks: 12, noise_gate_threshold: 0.003
        };
        
        await invoke("start_system_audio_capture", {
          vadConfig,
          deviceId: microphoneDeviceId && microphoneDeviceId !== "default" ? microphoneDeviceId : null
        });
        
      } catch (err) {
        console.error("Native VAD failed:", err);
        setState((prev: any) => ({
          ...prev,
          error: "Native microphone access failed.",
        }));
        setEnableVAD(false);
      }
    };

    startNativeVAD();

    // Cleanup when user clicks the mic button again to turn it off
    return () => {
      if (unlistenSpeechDetected) unlistenSpeechDetected();
      if (unlistenSpeechStart) unlistenSpeechStart();
      invoke("stop_system_audio_capture").catch(() => {});
    };
  }, [allSttProviders, selectedSttProvider, submit, setState, setEnableVAD, microphoneDeviceId]);

  // Provide manual override to turn it off
  const handleToggleOff = () => {
    setEnableVAD(false);
  };

  if (isTranscribing) {
    return (
      <Button size="icon" onClick={handleToggleOff} className="cursor-pointer">
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      onClick={handleToggleOff}
      className="cursor-pointer"
      title="Click to turn off voice detection"
    >
      {isUserSpeaking ? (
        <LoaderCircleIcon className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <MicOffIcon className="h-4 w-4 animate-pulse text-red-500" />
      )}
    </Button>
  );
};