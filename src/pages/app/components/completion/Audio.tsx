import { InfoIcon, MicIcon, LoaderCircleIcon, SquareIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { UseCompletionReturn } from "@/types";
import { useApp } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  isRecording,
  isTranscribing,
  toggleManualRecording,
}: UseCompletionReturn) => {
  const { selectedSttProvider, pluelyApiEnabled } = useApp();

  const speechProviderStatus = selectedSttProvider.provider;
  const isProviderConfigured = pluelyApiEnabled || !!speechProviderStatus;

  if (isProviderConfigured) {
    if (isTranscribing) {
      return (
        <Button size="icon" disabled variant="outline" className="cursor-not-allowed">
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        </Button>
      );
    }

    return (
      <Button
        size="icon"
        onClick={toggleManualRecording}
        variant={isRecording ? "default" : "ghost"}
        className="cursor-pointer transition-all"
        title={isRecording ? "Stop recording & process" : "Start manual recording"}
      >
        {isRecording ? (
          <SquareIcon className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Not Configured Warning
  return (
    <Popover open={micOpen} onOpenChange={setMicOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          onClick={() => setMicOpen(true)}
          className="cursor-pointer"
          title="Speech provider not configured"
        >
          <MicIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="center"
        side="top"
        className="w-80 p-3"
        sideOffset={8}
      >
        <div className="text-sm select-none">
          <div className="font-semibold text-orange-600 mb-1">
            Speech Provider Configuration Required
          </div>
          <div className="text-muted-foreground mt-2 space-y-2">
            <div className="flex flex-row gap-1 items-center text-orange-600">
              <InfoIcon size={16} />
              <span>PROVIDER IS MISSING</span>
            </div>
            <span className="block">
              Please go to settings and configure your speech provider to
              enable voice input.
            </span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};