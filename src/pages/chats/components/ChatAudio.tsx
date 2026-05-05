import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { useApp } from "@/contexts";

interface ChatAudioProps {
  micOpen: boolean;
  setMicOpen: (open: boolean) => void;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  disabled: boolean;
}

export const ChatAudio = ({
  micOpen,
  setMicOpen,
  isRecording,
  setIsRecording,
  disabled,
}: ChatAudioProps) => {
  const { selectedSttProvider, pluelyApiEnabled } = useApp();
  const isProviderConfigured = pluelyApiEnabled || !!selectedSttProvider.provider;

  // IF CONFIGURED: Return normal button
  if (isProviderConfigured) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => setIsRecording(!isRecording)}
        className="size-7 lg:size-9 rounded-lg lg:rounded-xl"
        title={isRecording ? "Recording..." : "Voice input"}
        disabled={disabled}
      >
        <MicIcon
          className={`size-3 lg:size-4 ${
            isRecording ? "text-red-500 animate-pulse" : ""
          }`}
        />
      </Button>
    );
  }

  // IF NOT CONFIGURED: Return Popover warning
  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setMicOpen(true)}
          className="size-7 lg:size-9 rounded-lg lg:rounded-xl"
          title="Voice input"
          disabled={disabled}
        >
          <MicIcon className="size-3 lg:size-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        className="w-80 p-3"
        sideOffset={8}
      >
        <div className="text-sm">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Required
          </div>
          <div className="text-muted-foreground mt-2 space-y-2">
            <div className="flex items-center gap-1 text-orange-600">
              <InfoIcon size={16} />
              <span>Provider not configured</span>
            </div>
            <span className="block">
              Configure a speech provider in settings to enable voice input.
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};