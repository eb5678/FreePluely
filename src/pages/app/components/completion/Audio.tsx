import { InfoIcon, MicIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, Button } from "@/components";
import { AutoSpeechVAD } from "./AutoSpeechVad";
import { UseCompletionReturn } from "@/types";
import { useApp } from "@/contexts";

export const Audio = ({
  micOpen,
  setMicOpen,
  enableVAD,
  setEnableVAD,
  submit,
  setState,
}: UseCompletionReturn) => {
  const { selectedSttProvider, pluelyApiEnabled, selectedAudioDevices } =
    useApp();

  const speechProviderStatus = selectedSttProvider.provider;
  const isProviderConfigured = pluelyApiEnabled || !!speechProviderStatus;

  // IF CONFIGURED: Return the normal button without any Popover interference!
  if (isProviderConfigured) {
    if (enableVAD) {
      return (
        <AutoSpeechVAD
          key={selectedAudioDevices.input.id}
          submit={submit}
          setState={setState}
          setEnableVAD={setEnableVAD}
          microphoneDeviceId={selectedAudioDevices.input.id}
        />
      );
    }

    return (
      <Button
        size="icon"
        onClick={() => setEnableVAD(true)}
        className="cursor-pointer"
        title="Toggle voice input"
      >
        <MicIcon className="h-4 w-4" />
      </Button>
    );
  }

  // IF NOT CONFIGURED: Return the Popover warning
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
        align="end"
        side="bottom"
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